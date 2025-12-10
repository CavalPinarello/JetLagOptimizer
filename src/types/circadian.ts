/**
 * Circadian Types
 *
 * Core types for circadian rhythm calculations, phase response curves,
 * and zeitgeber timing. These are the scientific foundations of the app.
 */

/**
 * Phase shift direction
 */
export type PhaseShiftDirection = 'advance' | 'delay';

/**
 * Zeitgeber (time-giver) types that influence circadian rhythm
 */
export type ZeitgeberType =
  | 'light'
  | 'melatonin'
  | 'exercise'
  | 'meals'
  | 'temperature'
  | 'social';

/**
 * Light intensity levels for recommendations
 */
export interface LightLevel {
  lux: number;
  description: string;
  examples: string[];
}

export const LIGHT_LEVELS: Record<string, LightLevel> = {
  dim: {
    lux: 50,
    description: 'Dim light',
    examples: ['Candlelight', 'Night light', 'Dim room'],
  },
  indoor: {
    lux: 300,
    description: 'Typical indoor light',
    examples: ['Office lighting', 'Home lighting'],
  },
  bright_indoor: {
    lux: 1000,
    description: 'Bright indoor light',
    examples: ['Light therapy box', 'Bright office'],
  },
  cloudy: {
    lux: 10000,
    description: 'Overcast daylight',
    examples: ['Cloudy day outdoors'],
  },
  sunlight: {
    lux: 100000,
    description: 'Direct sunlight',
    examples: ['Sunny day outdoors', 'Morning sun'],
  },
};

/**
 * Phase Response Curve data point
 * Describes the phase shift effect of a zeitgeber at a given circadian time
 */
export interface PRCDataPoint {
  circadianTime: number;  // 0-24 hours relative to CBTmin
  phaseShift: number;     // Hours of shift (positive = advance, negative = delay)
}

/**
 * Complete Phase Response Curve
 */
export interface PhaseResponseCurve {
  zeitgeber: ZeitgeberType;
  dataPoints: PRCDataPoint[];
  peakAdvanceTime: number;    // CT when advance is maximum
  peakDelayTime: number;      // CT when delay is maximum
  deadZone: { start: number; end: number }; // CT range with minimal effect
}

/**
 * Circadian time relative to core body temperature minimum
 * CT0 = CBTmin
 * Typically CBTmin occurs ~2-3h before habitual wake time
 */
export interface CircadianTimeInfo {
  clockTime: string;          // HH:MM local time
  circadianTime: number;      // 0-24 relative to CBTmin
  phase: 'advance' | 'delay' | 'dead_zone';
  lightRecommendation: 'seek' | 'avoid' | 'neutral';
}

/**
 * DLMO and CBTmin estimation parameters
 */
export interface CircadianMarkerEstimates {
  // Primary markers (in HH:MM format)
  dlmo: string;               // Dim Light Melatonin Onset
  cbtMin: string;             // Core Body Temperature minimum

  // Derived windows
  sleepOnset: string;         // Typical sleep onset (~2h after DLMO)
  sleepOffset: string;        // Typical wake time (~2h after CBTmin)

  // Phase windows
  advanceWindow: {            // Best time for phase advance
    start: string;
    end: string;
    peakEffect: string;
  };
  delayWindow: {              // Best time for phase delay
    start: string;
    end: string;
    peakEffect: string;
  };

  // Estimation confidence
  method: 'MEQ' | 'MCTQ' | 'direct' | 'combined';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Daily circadian phase tracking
 */
export interface DailyCircadianState {
  date: Date;
  timezone: string;

  // Current phase estimates
  currentDLMO: string;
  currentCBTmin: string;

  // Target (destination) phase
  targetDLMO: string;
  targetCBTmin: string;

  // Progress metrics
  phaseShiftFromOrigin: number;    // Hours shifted from home
  phaseShiftRemaining: number;     // Hours left to adjust
  adjustmentProgress: number;      // 0-100%

  // Internal desynchrony tracking
  scnPhase: number;                // Central (SCN) clock phase
  peripheralPhase: number;         // Peripheral clocks phase
  desynchronyLevel: 'none' | 'mild' | 'moderate' | 'severe';
}

/**
 * Phase shift calculation input
 */
export interface PhaseShiftInput {
  currentCBTmin: string;
  targetCBTmin: string;
  direction: PhaseShiftDirection;
  chronotype: import('./user').ChronotypeCategory;
  interventionsEnabled: import('./protocol').InterventionType[];
}

/**
 * Phase shift calculation result
 */
export interface PhaseShiftResult {
  totalShiftNeeded: number;        // Hours
  direction: PhaseShiftDirection;
  estimatedDaysToAdjust: number;
  dailyShiftRate: number;          // Hours per day

  // Day-by-day progression
  dailyPhaseProgression: {
    day: number;
    estimatedCBTmin: string;
    estimatedDLMO: string;
    cumulativeShift: number;
  }[];
}

/**
 * Optimal zeitgeber timing for a given phase
 */
export interface ZeitgeberRecommendation {
  zeitgeber: ZeitgeberType;
  action: 'seek' | 'avoid' | 'take' | 'do';
  optimalWindow: {
    start: string;
    end: string;
  };
  expectedEffect: PhaseShiftDirection;
  magnitude: number;               // Expected hours of shift
  priority: 'high' | 'medium' | 'low';
  notes: string;
}

/**
 * Complete zeitgeber schedule for a day
 */
export interface DailyZeitgeberSchedule {
  date: Date;
  timezone: string;

  // Light management
  lightExposureWindows: Array<{
    start: string;
    end: string;
    intensity: 'bright' | 'moderate';
    outdoorPreferred: boolean;
  }>;
  lightAvoidanceWindows: Array<{
    start: string;
    end: string;
    blueBlockersRecommended: boolean;
  }>;

  // Supplement timing
  melatoninTiming?: {
    time: string;
    dose: number;
    rationale: string;
  };

  // Caffeine management
  caffeineCutoff: string;
  caffeineOptimalWindows?: string[];

  // Meal anchors
  anchorMeals: Array<{
    meal: 'breakfast' | 'lunch' | 'dinner';
    targetTime: string;
    isAnchorMeal: boolean;
    notes?: string;
  }>;

  // Exercise timing
  exerciseWindow?: {
    start: string;
    end: string;
    intensity: 'light' | 'moderate' | 'vigorous';
    outdoorPreferred: boolean;
  };

  // Sleep window
  targetBedtime: string;
  targetWakeTime: string;
  napAllowed: boolean;
  napWindow?: {
    start: string;
    end: string;
    maxDuration: number;
  };
}

/**
 * Standard Light Phase Response Curve
 * Based on research: light has maximum advance effect ~2-4h after CBTmin
 * and maximum delay effect ~6-8h before CBTmin
 */
export const LIGHT_PRC: PhaseResponseCurve = {
  zeitgeber: 'light',
  dataPoints: [
    { circadianTime: 0, phaseShift: 0 },      // At CBTmin - transition point
    { circadianTime: 2, phaseShift: 2.5 },    // Peak advance
    { circadianTime: 4, phaseShift: 2.0 },
    { circadianTime: 6, phaseShift: 1.0 },
    { circadianTime: 8, phaseShift: 0.3 },
    { circadianTime: 10, phaseShift: 0 },     // Dead zone start
    { circadianTime: 12, phaseShift: 0 },
    { circadianTime: 14, phaseShift: 0 },     // Dead zone end
    { circadianTime: 16, phaseShift: -0.5 },
    { circadianTime: 18, phaseShift: -1.5 },
    { circadianTime: 20, phaseShift: -2.5 },  // Peak delay
    { circadianTime: 22, phaseShift: -2.0 },
    { circadianTime: 24, phaseShift: 0 },     // Back to CBTmin
  ],
  peakAdvanceTime: 2,
  peakDelayTime: 20,
  deadZone: { start: 10, end: 14 },
};

/**
 * Melatonin Phase Response Curve
 * Generally opposite to light PRC
 * Advance effect in late afternoon/evening, delay in morning
 */
export const MELATONIN_PRC: PhaseResponseCurve = {
  zeitgeber: 'melatonin',
  dataPoints: [
    { circadianTime: 0, phaseShift: 0 },
    { circadianTime: 2, phaseShift: -0.5 },   // Slight delay
    { circadianTime: 4, phaseShift: -1.0 },   // Peak delay
    { circadianTime: 6, phaseShift: -0.5 },
    { circadianTime: 8, phaseShift: 0 },
    { circadianTime: 10, phaseShift: 0 },     // Dead zone
    { circadianTime: 12, phaseShift: 0.3 },
    { circadianTime: 14, phaseShift: 0.8 },
    { circadianTime: 16, phaseShift: 1.2 },
    { circadianTime: 18, phaseShift: 1.5 },   // Peak advance
    { circadianTime: 20, phaseShift: 1.0 },
    { circadianTime: 22, phaseShift: 0.3 },
    { circadianTime: 24, phaseShift: 0 },
  ],
  peakAdvanceTime: 18,
  peakDelayTime: 4,
  deadZone: { start: 8, end: 12 },
};

/**
 * Helper: Estimate DLMO from MEQ score
 * Based on research correlating MEQ with circadian phase
 */
export function estimateDLMOFromMEQ(meqScore: number): string {
  // MEQ 16 (extreme evening) → DLMO ~23:30
  // MEQ 86 (extreme morning) → DLMO ~19:00
  // Linear interpolation between extremes
  const dlmoHours = 23.5 - ((meqScore - 16) / 70) * 4.5;
  const hours = Math.floor(dlmoHours);
  const minutes = Math.round((dlmoHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Helper: Estimate CBTmin from DLMO
 * CBTmin typically occurs ~7 hours after DLMO
 */
export function estimateCBTminFromDLMO(dlmo: string): string {
  const [hours, minutes] = dlmo.split(':').map(Number);
  let cbtMinHours = hours + 7;
  if (cbtMinHours >= 24) cbtMinHours -= 24;
  return `${cbtMinHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Helper: Estimate DLMO from mid-sleep on free days (MCTQ)
 * DLMO typically occurs ~2 hours before mid-sleep
 */
export function estimateDLMOFromMSFsc(msfsc: string): string {
  const [hours, minutes] = msfsc.split(':').map(Number);
  let dlmoHours = hours - 2;
  if (dlmoHours < 0) dlmoHours += 24;
  return `${dlmoHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Get phase shift effect of light at a given time
 */
export function getLightPhaseEffect(
  clockTime: string,
  currentCBTmin: string
): { direction: PhaseShiftDirection | 'neutral'; magnitude: number } {
  // Calculate circadian time
  const [clockH, clockM] = clockTime.split(':').map(Number);
  const [cbtH, cbtM] = currentCBTmin.split(':').map(Number);

  let ctHours = (clockH + clockM / 60) - (cbtH + cbtM / 60);
  if (ctHours < 0) ctHours += 24;
  if (ctHours >= 24) ctHours -= 24;

  // Look up in PRC (linear interpolation between data points)
  const prc = LIGHT_PRC.dataPoints;
  for (let i = 0; i < prc.length - 1; i++) {
    if (ctHours >= prc[i].circadianTime && ctHours < prc[i + 1].circadianTime) {
      const ratio = (ctHours - prc[i].circadianTime) /
                    (prc[i + 1].circadianTime - prc[i].circadianTime);
      const shift = prc[i].phaseShift + ratio * (prc[i + 1].phaseShift - prc[i].phaseShift);

      if (Math.abs(shift) < 0.1) {
        return { direction: 'neutral', magnitude: 0 };
      }
      return {
        direction: shift > 0 ? 'advance' : 'delay',
        magnitude: Math.abs(shift),
      };
    }
  }

  return { direction: 'neutral', magnitude: 0 };
}
