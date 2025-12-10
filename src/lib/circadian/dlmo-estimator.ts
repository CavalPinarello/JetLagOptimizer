/**
 * DLMO and CBTmin Estimation
 *
 * Estimates Dim Light Melatonin Onset (DLMO) and Core Body Temperature
 * minimum (CBTmin) from questionnaire data. These are the key markers
 * for determining circadian phase and timing interventions.
 */

import type { ChronotypeCategory } from '@/types/user';
import type { CircadianMarkerEstimates } from '@/types/circadian';
import { timeToDecimal, decimalToTime } from './chronotype';

/**
 * Typical relationships between circadian markers:
 * - DLMO occurs ~2-3 hours before habitual sleep onset
 * - CBTmin occurs ~7 hours after DLMO
 * - CBTmin typically occurs ~2-3 hours before habitual wake time
 * - Sleep onset typically occurs ~2 hours after DLMO
 */

/**
 * Estimate DLMO from MEQ score
 * Based on research correlating MEQ with circadian phase
 */
export function estimateDLMOFromMEQ(meqScore: number): string {
  // MEQ 16 (extreme evening) → DLMO ~23:30 (11:30 PM)
  // MEQ 86 (extreme morning) → DLMO ~19:00 (7:00 PM)
  // Linear interpolation between extremes
  const dlmoHours = 23.5 - ((meqScore - 16) / 70) * 4.5;
  return decimalToTime(dlmoHours);
}

/**
 * Estimate DLMO from mid-sleep on free days (MSFsc)
 * DLMO typically occurs ~6 hours before MSFsc
 */
export function estimateDLMOFromMSFsc(msfsc: string): string {
  const msfscDecimal = timeToDecimal(msfsc);
  // DLMO is approximately 6 hours before mid-sleep
  // This accounts for the ~2h DLMO-to-sleep onset + ~4h to mid-sleep
  return decimalToTime(msfscDecimal - 6);
}

/**
 * Estimate DLMO from habitual bedtime
 * DLMO typically occurs 2-3 hours before sleep onset
 */
export function estimateDLMOFromBedtime(
  bedtime: string,
  sleepLatency: number = 15
): string {
  const bedtimeDecimal = timeToDecimal(bedtime);
  // Sleep onset = bedtime + sleep latency
  const sleepOnset = bedtimeDecimal + sleepLatency / 60;
  // DLMO = sleep onset - 2 hours
  return decimalToTime(sleepOnset - 2);
}

/**
 * Estimate CBTmin from DLMO
 * CBTmin typically occurs ~7 hours after DLMO
 */
export function estimateCBTminFromDLMO(dlmo: string): string {
  const dlmoDecimal = timeToDecimal(dlmo);
  return decimalToTime(dlmoDecimal + 7);
}

/**
 * Estimate CBTmin from habitual wake time
 * CBTmin typically occurs ~2-3 hours before wake time
 */
export function estimateCBTminFromWakeTime(wakeTime: string): string {
  const wakeDecimal = timeToDecimal(wakeTime);
  return decimalToTime(wakeDecimal - 2.5);
}

/**
 * Get optimal advance window based on CBTmin
 * Light exposure 2-4h after CBTmin causes phase advance
 */
export function getAdvanceWindow(cbtmin: string): { start: string; end: string; peak: string } {
  const cbtminDecimal = timeToDecimal(cbtmin);
  return {
    start: decimalToTime(cbtminDecimal + 1),
    end: decimalToTime(cbtminDecimal + 6),
    peak: decimalToTime(cbtminDecimal + 2.5),
  };
}

/**
 * Get optimal delay window based on CBTmin
 * Light exposure 6-8h before CBTmin causes phase delay
 */
export function getDelayWindow(cbtmin: string): { start: string; end: string; peak: string } {
  const cbtminDecimal = timeToDecimal(cbtmin);
  return {
    start: decimalToTime(cbtminDecimal - 8),
    end: decimalToTime(cbtminDecimal - 4),
    peak: decimalToTime(cbtminDecimal - 6),
  };
}

/**
 * Get dead zone - when light has minimal circadian effect
 */
export function getDeadZone(cbtmin: string): { start: string; end: string } {
  const cbtminDecimal = timeToDecimal(cbtmin);
  return {
    start: decimalToTime(cbtminDecimal + 8),
    end: decimalToTime(cbtminDecimal - 10), // Wraps to next day
  };
}

/**
 * Comprehensive DLMO/CBTmin estimation combining multiple inputs
 * Provides best estimate with confidence level
 */
export function estimateCircadianMarkers(
  options: {
    meqScore?: number | null;
    msfsc?: string | null;
    habitualBedtime?: string;
    habitualWakeTime?: string;
    sleepLatency?: number;
    chronotype?: ChronotypeCategory;
  }
): CircadianMarkerEstimates {
  const { meqScore, msfsc, habitualBedtime, habitualWakeTime, sleepLatency = 15 } = options;

  let dlmoEstimates: number[] = [];
  let cbtminEstimates: number[] = [];
  let method: 'MEQ' | 'MCTQ' | 'direct' | 'combined' = 'direct';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // Estimate from MEQ
  if (meqScore !== null && meqScore !== undefined) {
    const dlmoFromMEQ = estimateDLMOFromMEQ(meqScore);
    dlmoEstimates.push(timeToDecimal(dlmoFromMEQ));
    method = 'MEQ';
    confidence = 'medium';
  }

  // Estimate from MCTQ (MSFsc)
  if (msfsc) {
    const dlmoFromMCTQ = estimateDLMOFromMSFsc(msfsc);
    dlmoEstimates.push(timeToDecimal(dlmoFromMCTQ));
    method = meqScore ? 'combined' : 'MCTQ';
    confidence = meqScore ? 'high' : 'medium';
  }

  // Estimate from habitual bedtime
  if (habitualBedtime) {
    const dlmoFromBed = estimateDLMOFromBedtime(habitualBedtime, sleepLatency);
    dlmoEstimates.push(timeToDecimal(dlmoFromBed));
  }

  // Estimate CBTmin from wake time if available
  if (habitualWakeTime) {
    const cbtminFromWake = estimateCBTminFromWakeTime(habitualWakeTime);
    cbtminEstimates.push(timeToDecimal(cbtminFromWake));
  }

  // Calculate average DLMO (handling overnight wrap)
  let avgDLMO: number;
  if (dlmoEstimates.length > 0) {
    // Use circular mean for times that might wrap around midnight
    avgDLMO = circularMean(dlmoEstimates, 24);
  } else {
    // Default to 21:00 (9 PM) if no data
    avgDLMO = 21;
  }

  // Calculate CBTmin from DLMO
  let avgCBTmin: number;
  if (cbtminEstimates.length > 0) {
    // Average CBTmin estimates with the one derived from DLMO
    const dlmoDerivedCBTmin = timeToDecimal(estimateCBTminFromDLMO(decimalToTime(avgDLMO)));
    avgCBTmin = circularMean([...cbtminEstimates, dlmoDerivedCBTmin], 24);
  } else {
    avgCBTmin = timeToDecimal(estimateCBTminFromDLMO(decimalToTime(avgDLMO)));
  }

  const dlmo = decimalToTime(avgDLMO);
  const cbtMin = decimalToTime(avgCBTmin);

  // Calculate phase windows
  const advanceWindow = getAdvanceWindow(cbtMin);
  const delayWindow = getDelayWindow(cbtMin);

  return {
    dlmo,
    cbtMin,
    sleepOnset: decimalToTime(avgDLMO + 2),
    sleepOffset: decimalToTime(avgCBTmin + 2),
    advanceWindow: {
      start: advanceWindow.start,
      end: advanceWindow.end,
      peakEffect: advanceWindow.peak,
    },
    delayWindow: {
      start: delayWindow.start,
      end: delayWindow.end,
      peakEffect: delayWindow.peak,
    },
    method,
    confidence,
  };
}

/**
 * Calculate circular mean for time values (handles midnight wrap)
 */
function circularMean(values: number[], period: number = 24): number {
  if (values.length === 0) return 0;

  const radians = values.map((v) => (v / period) * 2 * Math.PI);
  const sinSum = radians.reduce((sum, r) => sum + Math.sin(r), 0);
  const cosSum = radians.reduce((sum, r) => sum + Math.cos(r), 0);

  let meanRadians = Math.atan2(sinSum / values.length, cosSum / values.length);
  if (meanRadians < 0) meanRadians += 2 * Math.PI;

  return (meanRadians / (2 * Math.PI)) * period;
}

/**
 * Shift DLMO by a specified number of hours
 * Used for tracking phase progression during adjustment
 */
export function shiftDLMO(dlmo: string, hoursShift: number): string {
  const dlmoDecimal = timeToDecimal(dlmo);
  return decimalToTime(dlmoDecimal + hoursShift);
}

/**
 * Calculate the phase difference between current and target DLMO
 * Returns hours (positive = need to advance, negative = need to delay)
 */
export function calculatePhaseGap(currentDLMO: string, targetDLMO: string): number {
  const current = timeToDecimal(currentDLMO);
  let target = timeToDecimal(targetDLMO);

  let diff = target - current;

  // Normalize to -12 to +12 hour range
  // Take the shortest path around the clock
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;

  return diff;
}

/**
 * Determine optimal shift direction based on timezone difference
 * For small differences, choose the direction that requires less total shift
 * For larger differences, follow the natural direction
 */
export function determineShiftDirection(
  timezoneShiftHours: number
): 'advance' | 'delay' {
  // Positive timezone shift = eastward = need to advance
  // Negative timezone shift = westward = need to delay

  // For shifts > 12 hours, go the "short way" around
  let effectiveShift = timezoneShiftHours;
  if (effectiveShift > 12) {
    effectiveShift -= 24;
  } else if (effectiveShift < -12) {
    effectiveShift += 24;
  }

  return effectiveShift >= 0 ? 'advance' : 'delay';
}
