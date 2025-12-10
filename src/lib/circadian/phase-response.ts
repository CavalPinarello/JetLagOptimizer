/**
 * Phase Response Curve (PRC) Implementation
 *
 * Phase Response Curves describe how zeitgebers (light, melatonin, etc.)
 * affect circadian phase depending on the time of exposure relative to
 * the body's current circadian phase.
 *
 * Key concept: The effect of a zeitgeber depends on WHEN it's applied:
 * - Light in early morning → phase ADVANCE (good for eastward travel)
 * - Light in evening → phase DELAY (good for westward travel)
 * - Melatonin has roughly the opposite effect of light
 */

import type {
  PhaseResponseCurve,
  PRCDataPoint,
  PhaseShiftDirection,
  ZeitgeberType,
  ZeitgeberRecommendation,
} from '@/types/circadian';
import { timeToDecimal, decimalToTime } from './chronotype';

/**
 * Light Phase Response Curve
 * Based on research by Khalsa et al., Minors et al., and others
 *
 * Circadian Time (CT) is relative to CBTmin:
 * - CT 0 = CBTmin (typically ~4-5 AM)
 * - CT 12 = 12 hours after CBTmin (midday subjective time)
 *
 * Response values in hours of phase shift:
 * - Positive = advance (earlier sleep/wake)
 * - Negative = delay (later sleep/wake)
 */
export const LIGHT_PRC: PhaseResponseCurve = {
  zeitgeber: 'light',
  dataPoints: [
    { circadianTime: 0, phaseShift: 0 },       // CBTmin - crossover point
    { circadianTime: 1, phaseShift: 1.5 },     // Advance zone begins
    { circadianTime: 2, phaseShift: 2.5 },     // Near peak advance
    { circadianTime: 3, phaseShift: 2.8 },     // Peak advance ~2-4h after CBTmin
    { circadianTime: 4, phaseShift: 2.5 },
    { circadianTime: 5, phaseShift: 2.0 },
    { circadianTime: 6, phaseShift: 1.5 },
    { circadianTime: 7, phaseShift: 1.0 },
    { circadianTime: 8, phaseShift: 0.5 },
    { circadianTime: 9, phaseShift: 0.2 },
    { circadianTime: 10, phaseShift: 0 },      // Dead zone starts
    { circadianTime: 11, phaseShift: 0 },
    { circadianTime: 12, phaseShift: 0 },      // Dead zone middle
    { circadianTime: 13, phaseShift: 0 },
    { circadianTime: 14, phaseShift: -0.1 },   // Dead zone ends
    { circadianTime: 15, phaseShift: -0.3 },
    { circadianTime: 16, phaseShift: -0.8 },
    { circadianTime: 17, phaseShift: -1.2 },
    { circadianTime: 18, phaseShift: -1.8 },
    { circadianTime: 19, phaseShift: -2.2 },
    { circadianTime: 20, phaseShift: -2.5 },   // Peak delay ~6-8h before CBTmin
    { circadianTime: 21, phaseShift: -2.3 },
    { circadianTime: 22, phaseShift: -1.8 },
    { circadianTime: 23, phaseShift: -1.0 },
    { circadianTime: 24, phaseShift: 0 },      // Back to CBTmin
  ],
  peakAdvanceTime: 3,      // 3h after CBTmin
  peakDelayTime: 20,       // 20h after CBTmin (4h before)
  deadZone: { start: 10, end: 14 },
};

/**
 * Melatonin Phase Response Curve
 * Generally opposite to light PRC
 * Based on research by Lewy et al., Burgess et al.
 */
export const MELATONIN_PRC: PhaseResponseCurve = {
  zeitgeber: 'melatonin',
  dataPoints: [
    { circadianTime: 0, phaseShift: 0 },
    { circadianTime: 1, phaseShift: -0.3 },
    { circadianTime: 2, phaseShift: -0.5 },
    { circadianTime: 3, phaseShift: -0.8 },
    { circadianTime: 4, phaseShift: -1.0 },    // Peak delay in morning
    { circadianTime: 5, phaseShift: -0.8 },
    { circadianTime: 6, phaseShift: -0.5 },
    { circadianTime: 7, phaseShift: -0.2 },
    { circadianTime: 8, phaseShift: 0 },
    { circadianTime: 9, phaseShift: 0 },       // Minimal effect midday
    { circadianTime: 10, phaseShift: 0 },
    { circadianTime: 11, phaseShift: 0.1 },
    { circadianTime: 12, phaseShift: 0.3 },
    { circadianTime: 13, phaseShift: 0.5 },
    { circadianTime: 14, phaseShift: 0.8 },
    { circadianTime: 15, phaseShift: 1.0 },
    { circadianTime: 16, phaseShift: 1.3 },
    { circadianTime: 17, phaseShift: 1.5 },    // Peak advance in afternoon/evening
    { circadianTime: 18, phaseShift: 1.4 },
    { circadianTime: 19, phaseShift: 1.2 },
    { circadianTime: 20, phaseShift: 0.8 },
    { circadianTime: 21, phaseShift: 0.5 },
    { circadianTime: 22, phaseShift: 0.2 },
    { circadianTime: 23, phaseShift: 0 },
    { circadianTime: 24, phaseShift: 0 },
  ],
  peakAdvanceTime: 17,     // 5-6 hours before habitual bedtime
  peakDelayTime: 4,        // Early morning (rarely used)
  deadZone: { start: 8, end: 11 },
};

/**
 * Exercise Phase Response Curve
 * Based on research by Buxton et al., Youngstedt et al.
 * Less potent than light but can reinforce adjustments
 */
export const EXERCISE_PRC: PhaseResponseCurve = {
  zeitgeber: 'exercise',
  dataPoints: [
    { circadianTime: 0, phaseShift: 0 },
    { circadianTime: 2, phaseShift: 0.8 },
    { circadianTime: 4, phaseShift: 1.2 },     // Morning exercise advances
    { circadianTime: 6, phaseShift: 0.8 },
    { circadianTime: 8, phaseShift: 0.3 },
    { circadianTime: 10, phaseShift: 0 },
    { circadianTime: 12, phaseShift: 0 },
    { circadianTime: 14, phaseShift: 0 },
    { circadianTime: 16, phaseShift: -0.2 },
    { circadianTime: 18, phaseShift: -0.5 },
    { circadianTime: 20, phaseShift: -0.8 },   // Evening exercise delays
    { circadianTime: 22, phaseShift: -0.5 },
    { circadianTime: 24, phaseShift: 0 },
  ],
  peakAdvanceTime: 4,
  peakDelayTime: 20,
  deadZone: { start: 10, end: 16 },
};

/**
 * Convert clock time to circadian time relative to CBTmin
 */
export function clockToCircadianTime(clockTime: string, cbtmin: string): number {
  const clock = timeToDecimal(clockTime);
  const cbt = timeToDecimal(cbtmin);

  let ct = clock - cbt;
  // Normalize to 0-24 range
  while (ct < 0) ct += 24;
  while (ct >= 24) ct -= 24;

  return ct;
}

/**
 * Convert circadian time back to clock time
 */
export function circadianToClockTime(ct: number, cbtmin: string): string {
  const cbt = timeToDecimal(cbtmin);
  let clockTime = cbt + ct;
  // Normalize to 0-24 range
  while (clockTime < 0) clockTime += 24;
  while (clockTime >= 24) clockTime -= 24;

  return decimalToTime(clockTime);
}

/**
 * Get phase shift from PRC at a given circadian time
 * Uses linear interpolation between data points
 */
export function getPhaseShiftAtCT(prc: PhaseResponseCurve, ct: number): number {
  // Normalize CT to 0-24 range
  while (ct < 0) ct += 24;
  while (ct >= 24) ct -= 24;

  const points = prc.dataPoints;

  // Find surrounding data points
  for (let i = 0; i < points.length - 1; i++) {
    if (ct >= points[i].circadianTime && ct < points[i + 1].circadianTime) {
      // Linear interpolation
      const t =
        (ct - points[i].circadianTime) /
        (points[i + 1].circadianTime - points[i].circadianTime);
      return points[i].phaseShift + t * (points[i + 1].phaseShift - points[i].phaseShift);
    }
  }

  return 0;
}

/**
 * Get phase shift effect of light at a clock time given current CBTmin
 */
export function getLightEffect(
  clockTime: string,
  cbtmin: string
): { direction: PhaseShiftDirection | null; magnitude: number; inDeadZone: boolean } {
  const ct = clockToCircadianTime(clockTime, cbtmin);
  const shift = getPhaseShiftAtCT(LIGHT_PRC, ct);

  const inDeadZone =
    ct >= LIGHT_PRC.deadZone.start && ct <= LIGHT_PRC.deadZone.end;

  if (Math.abs(shift) < 0.1 || inDeadZone) {
    return { direction: null, magnitude: 0, inDeadZone };
  }

  return {
    direction: shift > 0 ? 'advance' : 'delay',
    magnitude: Math.abs(shift),
    inDeadZone,
  };
}

/**
 * Get phase shift effect of melatonin at a clock time given current CBTmin
 */
export function getMelatoninEffect(
  clockTime: string,
  cbtmin: string
): { direction: PhaseShiftDirection | null; magnitude: number } {
  const ct = clockToCircadianTime(clockTime, cbtmin);
  const shift = getPhaseShiftAtCT(MELATONIN_PRC, ct);

  if (Math.abs(shift) < 0.1) {
    return { direction: null, magnitude: 0 };
  }

  return {
    direction: shift > 0 ? 'advance' : 'delay',
    magnitude: Math.abs(shift),
  };
}

/**
 * Find optimal light exposure windows for a desired phase shift
 */
export function getOptimalLightWindows(
  cbtmin: string,
  desiredDirection: PhaseShiftDirection
): { optimal: { start: string; end: string }; avoid: { start: string; end: string } } {
  const cbtDecimal = timeToDecimal(cbtmin);

  if (desiredDirection === 'advance') {
    // Seek light 2-4h after CBTmin, avoid light before bed
    return {
      optimal: {
        start: decimalToTime(cbtDecimal + 1),
        end: decimalToTime(cbtDecimal + 5),
      },
      avoid: {
        start: decimalToTime(cbtDecimal - 8),
        end: decimalToTime(cbtDecimal - 2),
      },
    };
  } else {
    // Seek light in evening, avoid light in morning
    return {
      optimal: {
        start: decimalToTime(cbtDecimal - 8),
        end: decimalToTime(cbtDecimal - 4),
      },
      avoid: {
        start: decimalToTime(cbtDecimal + 1),
        end: decimalToTime(cbtDecimal + 5),
      },
    };
  }
}

/**
 * Find optimal melatonin timing for a desired phase shift
 */
export function getOptimalMelatoninTime(
  cbtmin: string,
  desiredDirection: PhaseShiftDirection
): { time: string; windowStart: string; windowEnd: string } {
  const cbtDecimal = timeToDecimal(cbtmin);

  if (desiredDirection === 'advance') {
    // Take melatonin in late afternoon/early evening
    // Peak effect at CT 17 (5h before typical sleep)
    const optimalCT = MELATONIN_PRC.peakAdvanceTime;
    return {
      time: circadianToClockTime(optimalCT, cbtmin),
      windowStart: circadianToClockTime(optimalCT - 2, cbtmin),
      windowEnd: circadianToClockTime(optimalCT + 2, cbtmin),
    };
  } else {
    // For delay, melatonin is less commonly used
    // If used, take in early morning
    const optimalCT = MELATONIN_PRC.peakDelayTime;
    return {
      time: circadianToClockTime(optimalCT, cbtmin),
      windowStart: circadianToClockTime(optimalCT - 2, cbtmin),
      windowEnd: circadianToClockTime(optimalCT + 2, cbtmin),
    };
  }
}

/**
 * Generate comprehensive zeitgeber recommendations for a day
 */
export function generateZeitgeberRecommendations(
  cbtmin: string,
  desiredDirection: PhaseShiftDirection,
  interventionsEnabled: ZeitgeberType[]
): ZeitgeberRecommendation[] {
  const recommendations: ZeitgeberRecommendation[] = [];

  // Light recommendations
  if (interventionsEnabled.includes('light')) {
    const lightWindows = getOptimalLightWindows(cbtmin, desiredDirection);

    recommendations.push({
      zeitgeber: 'light',
      action: 'seek',
      optimalWindow: lightWindows.optimal,
      expectedEffect: desiredDirection,
      magnitude: 2.0,
      priority: 'high',
      notes:
        desiredDirection === 'advance'
          ? 'Seek bright outdoor light in the morning to advance your clock'
          : 'Seek bright light in the evening to delay your clock',
    });

    recommendations.push({
      zeitgeber: 'light',
      action: 'avoid',
      optimalWindow: lightWindows.avoid,
      expectedEffect: desiredDirection === 'advance' ? 'delay' : 'advance',
      magnitude: 2.0,
      priority: 'high',
      notes:
        desiredDirection === 'advance'
          ? 'Avoid bright light in the evening to prevent delays'
          : 'Avoid bright light in the morning to prevent advances',
    });
  }

  // Melatonin recommendations
  if (interventionsEnabled.includes('melatonin') && desiredDirection === 'advance') {
    const melatoninTiming = getOptimalMelatoninTime(cbtmin, desiredDirection);

    recommendations.push({
      zeitgeber: 'melatonin',
      action: 'take',
      optimalWindow: {
        start: melatoninTiming.windowStart,
        end: melatoninTiming.windowEnd,
      },
      expectedEffect: 'advance',
      magnitude: 1.0,
      priority: 'medium',
      notes: 'Take 0.5-1mg melatonin 4-6 hours before target bedtime',
    });
  }

  // Exercise recommendations
  if (interventionsEnabled.includes('exercise')) {
    const exerciseWindow =
      desiredDirection === 'advance'
        ? {
            start: circadianToClockTime(2, cbtmin),
            end: circadianToClockTime(6, cbtmin),
          }
        : {
            start: circadianToClockTime(18, cbtmin),
            end: circadianToClockTime(22, cbtmin),
          };

    recommendations.push({
      zeitgeber: 'exercise',
      action: 'do',
      optimalWindow: exerciseWindow,
      expectedEffect: desiredDirection,
      magnitude: 0.8,
      priority: 'medium',
      notes:
        desiredDirection === 'advance'
          ? 'Morning exercise reinforces phase advance'
          : 'Evening exercise reinforces phase delay',
    });
  }

  // Meal timing recommendations
  if (interventionsEnabled.includes('meals')) {
    const mealWindow =
      desiredDirection === 'advance'
        ? {
            start: circadianToClockTime(3, cbtmin), // Early breakfast
            end: circadianToClockTime(5, cbtmin),
          }
        : {
            start: circadianToClockTime(19, cbtmin), // Later dinner
            end: circadianToClockTime(21, cbtmin),
          };

    recommendations.push({
      zeitgeber: 'meals',
      action: desiredDirection === 'advance' ? 'seek' : 'do',
      optimalWindow: mealWindow,
      expectedEffect: desiredDirection,
      magnitude: 0.5,
      priority: 'medium',
      notes:
        desiredDirection === 'advance'
          ? 'Eat breakfast early to anchor peripheral clocks'
          : 'Shift meals later to support phase delay',
    });
  }

  return recommendations;
}

/**
 * Calculate expected phase shift from a day's interventions
 * Takes into account the timing of each intervention
 */
export function calculateExpectedDailyShift(
  interventions: Array<{
    type: ZeitgeberType;
    time: string;
    duration?: number; // minutes for light
    dose?: number; // mg for melatonin
  }>,
  cbtmin: string
): { totalShift: number; direction: PhaseShiftDirection } {
  let totalShift = 0;

  for (const intervention of interventions) {
    let shift = 0;

    if (intervention.type === 'light') {
      const effect = getLightEffect(intervention.time, cbtmin);
      // Adjust for duration (base is 1 hour)
      const durationFactor = intervention.duration ? intervention.duration / 60 : 1;
      shift = effect.magnitude * durationFactor * (effect.direction === 'advance' ? 1 : -1);
    } else if (intervention.type === 'melatonin') {
      const effect = getMelatoninEffect(intervention.time, cbtmin);
      // Adjust for dose (base is 0.5mg)
      const doseFactor = intervention.dose ? Math.min(intervention.dose / 0.5, 2) : 1;
      shift = effect.magnitude * doseFactor * (effect.direction === 'advance' ? 1 : -1);
    }

    totalShift += shift;
  }

  // Practical limits: can't shift more than ~3 hours per day
  totalShift = Math.max(-3, Math.min(3, totalShift));

  return {
    totalShift: Math.abs(totalShift),
    direction: totalShift >= 0 ? 'advance' : 'delay',
  };
}
