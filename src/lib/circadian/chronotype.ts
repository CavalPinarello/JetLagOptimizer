/**
 * Chronotype Scoring and Classification
 *
 * Implements MEQ (Morningness-Eveningness Questionnaire) and MCTQ
 * (Munich Chronotype Questionnaire) scoring algorithms.
 */

import type { ChronotypeCategory, CircadianProfile } from '@/types/user';
import type { MEQResponse, MCTQResult } from '@/types/questionnaire';

/**
 * MEQ Score Ranges for Chronotype Classification
 * Based on Horne & Ostberg (1976)
 */
export const MEQ_RANGES = {
  definite_morning: { min: 70, max: 86 },
  moderate_morning: { min: 59, max: 69 },
  intermediate: { min: 42, max: 58 },
  moderate_evening: { min: 31, max: 41 },
  definite_evening: { min: 16, max: 30 },
} as const;

/**
 * Calculate MEQ total score from responses
 */
export function calculateMEQScore(responses: MEQResponse[]): number {
  if (responses.length !== 19) {
    throw new Error('MEQ requires exactly 19 responses');
  }
  return responses.reduce((sum, r) => sum + r.selectedValue, 0);
}

/**
 * Get chronotype category from MEQ score
 */
export function getChronotypeFromMEQ(score: number): ChronotypeCategory {
  if (score < 16 || score > 86) {
    throw new Error('MEQ score must be between 16 and 86');
  }

  if (score >= MEQ_RANGES.definite_morning.min) return 'definite_morning';
  if (score >= MEQ_RANGES.moderate_morning.min) return 'moderate_morning';
  if (score >= MEQ_RANGES.intermediate.min) return 'intermediate';
  if (score >= MEQ_RANGES.moderate_evening.min) return 'moderate_evening';
  return 'definite_evening';
}

/**
 * Parse HH:MM time string to decimal hours (0-24)
 */
export function timeToDecimal(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}

/**
 * Convert decimal hours to HH:MM format
 */
export function decimalToTime(decimal: number): string {
  // Normalize to 0-24 range
  while (decimal < 0) decimal += 24;
  while (decimal >= 24) decimal -= 24;

  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculate sleep onset time from bedtime and sleep latency
 */
export function calculateSleepOnset(
  bedtime: string,
  sleepPrepDuration: number,
  sleepLatency: number
): string {
  const bedtimeDecimal = timeToDecimal(bedtime);
  const totalDelay = (sleepPrepDuration + sleepLatency) / 60; // Convert to hours
  return decimalToTime(bedtimeDecimal + totalDelay);
}

/**
 * Calculate sleep duration in minutes
 */
export function calculateSleepDuration(
  sleepOnset: string,
  wakeTime: string
): number {
  let onset = timeToDecimal(sleepOnset);
  let wake = timeToDecimal(wakeTime);

  // Handle overnight sleep
  if (wake < onset) wake += 24;

  return Math.round((wake - onset) * 60);
}

/**
 * Calculate mid-sleep time (MSF for free days, MSW for work days)
 */
export function calculateMidSleep(sleepOnset: string, wakeTime: string): string {
  const onset = timeToDecimal(sleepOnset);
  let wake = timeToDecimal(wakeTime);

  // Handle overnight sleep
  if (wake < onset) wake += 24;

  const midSleep = (onset + wake) / 2;
  return decimalToTime(midSleep);
}

/**
 * Calculate corrected mid-sleep on free days (MSFsc)
 * Corrects for sleep debt accumulated during workdays
 * Based on Roenneberg et al. MCTQ methodology
 */
export function calculateMSFsc(mctq: MCTQResult): string {
  const sdWork = mctq.sleepDurationWorkday;
  const sdFree = mctq.sleepDurationFreeday;
  const msfDecimal = timeToDecimal(mctq.midSleepFreeday);

  // Calculate average sleep need
  // Assuming 5 work days and 2 free days per week
  const avgSleep = (sdWork * 5 + sdFree * 2) / 7;

  // If sleeping longer on free days than average, correct for oversleep
  if (sdFree > avgSleep) {
    const oversleep = (sdFree - avgSleep) / 60; // Convert to hours
    return decimalToTime(msfDecimal - oversleep / 2);
  }

  return mctq.midSleepFreeday;
}

/**
 * Calculate social jet lag - the difference between work and free day sleep patterns
 * Returns hours of difference
 */
export function calculateSocialJetLag(
  midSleepWorkday: string,
  midSleepFreeday: string
): number {
  const mswDecimal = timeToDecimal(midSleepWorkday);
  const msfDecimal = timeToDecimal(midSleepFreeday);

  let diff = msfDecimal - mswDecimal;

  // Handle overnight differences
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;

  return Math.abs(diff);
}

/**
 * Get chronotype category from MSFsc (MCTQ method)
 * Based on population studies correlating MSFsc with chronotype
 */
export function getChronotypeFromMSFsc(msfsc: string): ChronotypeCategory {
  const msfscDecimal = timeToDecimal(msfsc);

  // Approximate mapping based on MCTQ research
  // MSFsc < 2:30 → definite morning
  // MSFsc 2:30-3:30 → moderate morning
  // MSFsc 3:30-5:00 → intermediate
  // MSFsc 5:00-6:30 → moderate evening
  // MSFsc > 6:30 → definite evening
  if (msfscDecimal < 2.5) return 'definite_morning';
  if (msfscDecimal < 3.5) return 'moderate_morning';
  if (msfscDecimal < 5.0) return 'intermediate';
  if (msfscDecimal < 6.5) return 'moderate_evening';
  return 'definite_evening';
}

/**
 * Estimate MEQ score from MSFsc
 * Useful for combining MCTQ data with MEQ-based algorithms
 */
export function estimateMEQFromMSFsc(msfsc: string): number {
  const msfscDecimal = timeToDecimal(msfsc);

  // Linear interpolation based on research correlations
  // MSFsc 2:00 ≈ MEQ 75 (definite morning)
  // MSFsc 6:00 ≈ MEQ 35 (moderate evening)
  // Slope: (35 - 75) / (6 - 2) = -10 per hour

  const estimatedMEQ = 75 - (msfscDecimal - 2) * 10;

  // Clamp to valid MEQ range
  return Math.max(16, Math.min(86, Math.round(estimatedMEQ)));
}

/**
 * Get combined chronotype from both MEQ and MCTQ
 * When both are available, use weighted average
 */
export function getCombinedChronotype(
  meqScore: number | null,
  msfsc: string | null
): ChronotypeCategory {
  if (meqScore !== null && msfsc !== null) {
    // Both available - convert MCTQ to equivalent MEQ and average
    const mctqEquivalent = estimateMEQFromMSFsc(msfsc);
    const combinedScore = Math.round((meqScore + mctqEquivalent) / 2);
    return getChronotypeFromMEQ(combinedScore);
  }

  if (meqScore !== null) {
    return getChronotypeFromMEQ(meqScore);
  }

  if (msfsc !== null) {
    return getChronotypeFromMSFsc(msfsc);
  }

  // Default to intermediate if no data
  return 'intermediate';
}

/**
 * Get human-readable description of chronotype
 */
export function getChronotypeDescription(category: ChronotypeCategory): string {
  const descriptions: Record<ChronotypeCategory, string> = {
    definite_morning: 'Definite Morning Type (Early Bird)',
    moderate_morning: 'Moderate Morning Type',
    intermediate: 'Intermediate Type (Neither)',
    moderate_evening: 'Moderate Evening Type',
    definite_evening: 'Definite Evening Type (Night Owl)',
  };
  return descriptions[category];
}

/**
 * Get adaptation difficulty based on chronotype and travel direction
 * Returns a multiplier for estimated adjustment days
 *
 * Morning types adapt easier to eastward (phase advance)
 * Evening types adapt easier to westward (phase delay)
 */
export function getAdaptationFactor(
  chronotype: ChronotypeCategory,
  direction: 'eastward' | 'westward'
): number {
  const factors: Record<
    ChronotypeCategory,
    { eastward: number; westward: number }
  > = {
    definite_morning: { eastward: 0.8, westward: 1.2 },
    moderate_morning: { eastward: 0.9, westward: 1.1 },
    intermediate: { eastward: 1.0, westward: 1.0 },
    moderate_evening: { eastward: 1.1, westward: 0.9 },
    definite_evening: { eastward: 1.2, westward: 0.8 },
  };
  return factors[chronotype][direction];
}
