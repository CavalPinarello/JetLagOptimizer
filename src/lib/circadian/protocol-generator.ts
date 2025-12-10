/**
 * Protocol Generator Engine v4.0
 *
 * Generates personalized day-by-day circadian adjustment protocols
 * based on trip details, chronotype, and user preferences.
 *
 * v4.0 Changes (Timeshifter-Inspired):
 * 1. Flight day completely redesigned with specific timing based on departure/arrival
 * 2. In-flight naps are either 20-min (power nap) or 90-min (full sleep cycle)
 * 3. Airline meal timing calculated (~1.5h after takeoff, 1.5h before landing)
 * 4. Each intervention shows "It's X:XX at destination" context
 * 5. Caffeine/melatonin windows calculated from destination time
 * 6. Light avoidance during critical pre-CBTmin window
 * 7. Stay awake vs sleep guidance based on destination day/night
 * 8. Melatonin explicitly marked as fast-release (not slow-release)
 *
 * v3.0 Changes (Research-Based):
 * 1. Pre-departure reduced to 3 days max (research shows 3-day protocols effective)
 * 2. Caffeine cutoff at 14:00 (8h before bed) per user preference
 * 3. Melatonin timing at 5-5.5h before bed for optimal phase advance
 * 4. Wake time shift capped at 2h from habitual (realistic)
 * 5. Added creatine intervention for cognitive support
 * 6. Added chronotype-specific exercise guidance with intensity
 * 7. Added organ clock tracking data for visualization
 *
 * Scientific sources:
 * - Burgess et al. (2003) Preflight Adjustment to Eastward Travel
 * - Youngstedt (2019) Human Circadian PRCs for Exercise
 * - Eastman & Burgess (2009) How to Travel Without Jet Lag
 * - Timeshifter app methodology (Steven W. Lockley, Harvard)
 * - Sleep Foundation: Napping science (20-min vs 90-min)
 */

import type { Trip, TripDirection } from '@/types/trip';
import type { CircadianProfile, ChronotypeCategory, UserPreferences } from '@/types/user';
import type {
  Protocol,
  ProtocolDay,
  ProtocolPhase,
  Intervention,
  InterventionType,
  LightInterventionDetails,
  SleepInterventionDetails,
  MelatoninInterventionDetails,
  CaffeineInterventionDetails,
  MealInterventionDetails,
  ExerciseInterventionDetails,
  CreatineInterventionDetails,
} from '@/types/protocol';
import {
  estimateCircadianMarkers,
  shiftDLMO,
  calculatePhaseGap,
  determineShiftDirection,
} from './dlmo-estimator';
import {
  getOptimalLightWindows,
  circadianToClockTime,
} from './phase-response';
import { getAdaptationFactor, timeToDecimal, decimalToTime } from './chronotype';
import { generateId } from '@/lib/utils';

/**
 * Input parameters for protocol generation
 */
export interface ProtocolGeneratorInput {
  trip: Trip;
  circadianProfile: CircadianProfile;
  preferences: UserPreferences;
}

/**
 * Protocol phases with clear human-readable meaning
 */
type DetailedPhase =
  | 'pre_adjustment'      // Days -3 to -1: Gradual shift
  | 'flight_day'          // Day 0: Travel
  | 'arrival_day'         // Day 1: First full day at destination
  | 'active_adjustment'   // Days 2-N: Main adjustment period
  | 'fine_tuning'         // Near end: Minor adjustments
  | 'adjusted';           // Fully adapted

/**
 * Configuration for protocol generation
 */
interface GeneratorConfig {
  preDepartureDays: number;
  maxDailyShift: number;
  maxWakeShiftFromHabitual: number; // Cap on how early to wake
  interventionsEnabled: InterventionType[];
  targetBedtime: string;
  targetWakeTime: string;
}

// Constants based on research
const MAX_PRE_DEPARTURE_DAYS = 3;
const MAX_WAKE_SHIFT_HOURS = 2; // Don't wake more than 2h earlier than habitual
const CAFFEINE_CUTOFF_HOURS = 8; // 8h before bed (2 PM for 10 PM bedtime)
const MELATONIN_HOURS_BEFORE_BED = 5.5; // Research: max advance at 5.5h before bed
const PRE_DEPARTURE_SHIFT_PER_DAY = 0.5; // 30 min/day during pre-departure

/**
 * Calculate how many pre-departure days (max 3)
 */
function calculatePreDepartureDays(
  timezoneShiftHours: number,
  tripDurationDays: number
): number {
  // For very short trips, minimal adjustment
  if (tripDurationDays <= 2) return 0;
  if (tripDurationDays <= 4) return 2;

  // For longer trips, use 3 days max
  const absShift = Math.abs(timezoneShiftHours);
  if (absShift <= 3) return 2;
  return MAX_PRE_DEPARTURE_DAYS;
}

/**
 * Calculate daily shift rate based on chronotype and direction
 */
function calculateDailyShiftRate(
  chronotype: ChronotypeCategory,
  direction: TripDirection,
  withInterventions: boolean
): number {
  // Base rates from research
  let baseRate: number;
  if (direction === 'eastward') {
    // Phase advance is harder (~1h/day natural, ~1.5h with interventions)
    baseRate = withInterventions ? 1.5 : 1.0;
  } else {
    // Phase delay is easier (~1.5h/day natural, ~2h with interventions)
    baseRate = withInterventions ? 2.0 : 1.5;
  }

  // Adjust for chronotype
  const adaptationFactor = getAdaptationFactor(
    chronotype,
    direction === 'eastward' ? 'eastward' : 'westward'
  );

  return baseRate / adaptationFactor;
}

/**
 * Get detailed phase based on day number
 */
function getDetailedPhase(
  dayNumber: number,
  preDepartureDays: number,
  estimatedAdjustmentDays: number
): DetailedPhase {
  if (dayNumber < 0) return 'pre_adjustment';
  if (dayNumber === 0) return 'flight_day';
  if (dayNumber === 1) return 'arrival_day';
  if (dayNumber <= estimatedAdjustmentDays) return 'active_adjustment';
  if (dayNumber <= estimatedAdjustmentDays + 2) return 'fine_tuning';
  return 'adjusted';
}

/**
 * Map detailed phase to protocol phase
 */
function toProtocolPhase(phase: DetailedPhase): ProtocolPhase {
  switch (phase) {
    case 'pre_adjustment':
      return 'pre_departure';
    case 'flight_day':
      return 'in_flight';
    case 'arrival_day':
    case 'active_adjustment':
    case 'fine_tuning':
      return 'destination';
    case 'adjusted':
      return 'adjusted';
  }
}

/**
 * Clamp wake time to not be more than MAX_WAKE_SHIFT_HOURS earlier than habitual
 */
function clampWakeTime(
  newWakeTime: string,
  habitualWakeTime: string,
  direction: TripDirection
): string {
  const newWake = timeToDecimal(newWakeTime);
  const habitualWake = timeToDecimal(habitualWakeTime);

  if (direction === 'eastward') {
    // For eastward, we're shifting earlier - don't go more than 2h earlier
    const minWake = habitualWake - MAX_WAKE_SHIFT_HOURS;
    if (newWake < minWake) {
      return decimalToTime((minWake + 24) % 24);
    }
  } else {
    // For westward, we're shifting later - don't go more than 2h later
    const maxWake = habitualWake + MAX_WAKE_SHIFT_HOURS;
    if (newWake > maxWake) {
      return decimalToTime(maxWake % 24);
    }
  }
  return newWakeTime;
}

// ============================================================
// INTERVENTION GENERATORS - Research-Based v3.0
// ============================================================

/**
 * Generate light interventions
 */
function generateLightInterventions(
  currentCBTmin: string,
  direction: TripDirection,
  currentBedtime: string,
  currentWakeTime: string
): Intervention[] {
  const interventions: Intervention[] = [];
  const wakeDecimal = timeToDecimal(currentWakeTime);
  const bedDecimal = timeToDecimal(currentBedtime);

  if (direction === 'eastward') {
    // Morning light for phase advance (2-4h after CBTmin)
    // For practical purposes, this is shortly after wake time
    const optimalStart = wakeDecimal;
    const optimalEnd = optimalStart + 2;

    interventions.push({
      id: generateId(),
      type: 'light_exposure',
      startTime: decimalToTime(optimalStart),
      endTime: decimalToTime(Math.min(optimalEnd, 12)),
      duration: 60,
      title: 'Morning Bright Light',
      description: `Get 30-60 min of bright outdoor light shortly after waking. This is your most powerful tool for advancing your body clock.`,
      rationale: 'Light exposure after your core body temperature minimum advances your SCN (brain) clock. Research shows ~2h phase advance possible per day with proper light timing.',
      details: {
        type: 'light_exposure',
        intensity: 'bright',
        source: 'outdoor',
        luxTarget: 10000,
        blueBlockersRecommended: false,
        outdoorPreferred: true,
      } as LightInterventionDetails,
      priority: 'critical',
      completed: false,
      skipped: false,
    });

    // Evening light avoidance (3h before bed)
    const avoidStart = bedDecimal - 3;
    interventions.push({
      id: generateId(),
      type: 'light_avoidance',
      startTime: decimalToTime(avoidStart),
      endTime: currentBedtime,
      duration: null,
      title: 'Evening Light Avoidance',
      description: 'Dim lights, avoid screens, use blue-light blocking glasses. Critical for eastward adjustment.',
      rationale: 'Evening light causes phase delays - the opposite of what you want when traveling east. Avoiding it prevents undermining your morning light exposure.',
      details: {
        type: 'light_avoidance',
        intensity: 'dim',
        source: 'blue_light_glasses',
        luxTarget: 50,
        blueBlockersRecommended: true,
        outdoorPreferred: false,
      } as LightInterventionDetails,
      priority: 'critical',
      completed: false,
      skipped: false,
    });
  } else {
    // Westward - evening light exposure for phase delay
    const optimalStart = Math.max(17, bedDecimal - 4);
    const optimalEnd = bedDecimal - 1;

    interventions.push({
      id: generateId(),
      type: 'light_exposure',
      startTime: decimalToTime(optimalStart),
      endTime: decimalToTime(optimalEnd),
      duration: 60,
      title: 'Evening Bright Light',
      description: 'Get bright light exposure in the late afternoon/evening to delay your body clock.',
      rationale: 'Light before your temperature minimum delays your SCN clock. This helps you stay awake later, matching westward destinations.',
      details: {
        type: 'light_exposure',
        intensity: 'bright',
        source: 'outdoor',
        luxTarget: 10000,
        blueBlockersRecommended: false,
        outdoorPreferred: true,
      } as LightInterventionDetails,
      priority: 'critical',
      completed: false,
      skipped: false,
    });

    // Morning light avoidance for westward
    interventions.push({
      id: generateId(),
      type: 'light_avoidance',
      startTime: currentWakeTime,
      endTime: decimalToTime(wakeDecimal + 2),
      duration: null,
      title: 'Morning Light Avoidance',
      description: 'Wear sunglasses outdoors for 2h after waking. Avoid bright light.',
      rationale: 'Morning light would advance your clock, counteracting your westward adjustment. Block it with sunglasses.',
      details: {
        type: 'light_avoidance',
        intensity: 'dim',
        source: 'sunglasses',
        luxTarget: 500,
        blueBlockersRecommended: false,
        outdoorPreferred: false,
      } as LightInterventionDetails,
      priority: 'recommended',
      completed: false,
      skipped: false,
    });
  }

  return interventions;
}

/**
 * Generate sleep intervention
 */
function generateSleepIntervention(
  targetBedtime: string,
  targetWakeTime: string,
  detailedPhase: DetailedPhase,
  includeNap: boolean
): Intervention {
  const bedDecimal = timeToDecimal(targetBedtime);
  let wakeDecimal = timeToDecimal(targetWakeTime);
  if (wakeDecimal < bedDecimal) wakeDecimal += 24;
  const duration = Math.round((wakeDecimal - bedDecimal) * 60);

  let description = `Target bed: ${targetBedtime}, wake: ${targetWakeTime} (${Math.round(duration / 60)}h sleep).`;

  if (detailedPhase === 'arrival_day') {
    description += ' Push through fatigue to reach this schedule - it accelerates adjustment.';
  }

  const napAllowed = includeNap && (detailedPhase === 'arrival_day' || detailedPhase === 'active_adjustment');
  const details: SleepInterventionDetails = {
    type: 'sleep',
    targetBedtime,
    targetWakeTime,
    sleepDuration: duration,
    napAllowed,
    napWindow: napAllowed ? {
      start: decimalToTime((timeToDecimal(targetWakeTime) + 5) % 24),
      end: decimalToTime((timeToDecimal(targetWakeTime) + 7) % 24),
      maxDuration: 20,
    } : undefined,
  };

  return {
    id: generateId(),
    type: 'sleep',
    startTime: targetBedtime,
    endTime: targetWakeTime,
    duration,
    title: 'Sleep Window',
    description,
    rationale: 'Consistent sleep timing is one of the strongest zeitgebers. Your brain clock (SCN) and peripheral organ clocks all respond to sleep timing.',
    details,
    priority: 'critical',
    completed: false,
    skipped: false,
  };
}

/**
 * Generate caffeine guidance - cutoff at 14:00 (or 8h before bed)
 */
function generateCaffeineIntervention(
  currentWakeTime: string,
  currentBedtime: string
): Intervention {
  const wakeDecimal = timeToDecimal(currentWakeTime);
  const bedDecimal = timeToDecimal(currentBedtime);

  // Cutoff at 8 hours before bedtime, but no later than 14:00
  const calculatedCutoff = bedDecimal - CAFFEINE_CUTOFF_HOURS;
  const cutoffDecimal = Math.min(calculatedCutoff, 14);
  const cutoffTime = decimalToTime((cutoffDecimal + 24) % 24);

  const windowStart = decimalToTime(wakeDecimal + 0.5); // Start 30 min after wake
  const windowEnd = cutoffTime;

  const details: CaffeineInterventionDetails = {
    type: 'caffeine',
    allowed: true,
    cutoffTime,
    maxIntakeBeforeCutoff: '400mg (about 4 cups)',
    recommendedTimes: [
      decimalToTime(wakeDecimal + 0.5),
      decimalToTime(Math.min(wakeDecimal + 4, cutoffDecimal - 1)),
    ],
  };

  return {
    id: generateId(),
    type: 'caffeine',
    startTime: windowStart,
    endTime: windowEnd,
    duration: null,
    title: 'Caffeine Window',
    description: `Coffee/tea OK from ${windowStart} until ${windowEnd}. No caffeine after ${windowEnd} - strict cutoff.`,
    rationale: 'Caffeine has a 5-6h half-life. Late caffeine delays sleep onset by 40+ minutes and reduces deep sleep, undermining circadian adjustment.',
    details,
    priority: 'recommended',
    completed: false,
    skipped: false,
  };
}

/**
 * Generate melatonin intervention - 5.5h before bed for max phase advance
 */
function generateMelatoninIntervention(
  currentBedtime: string,
  direction: TripDirection,
  dose: number,
  detailedPhase: DetailedPhase
): Intervention | null {
  // Melatonin primarily for eastward (phase advance)
  // Also useful for westward but timing differs

  const bedDecimal = timeToDecimal(currentBedtime);
  let melatoninTime: string;
  let description: string;
  let rationale: string;

  if (direction === 'eastward') {
    // Research: max advance at ~5.5h before bedtime
    melatoninTime = decimalToTime((bedDecimal - MELATONIN_HOURS_BEFORE_BED + 24) % 24);
    description = `Take ${dose}mg melatonin at ${melatoninTime} (${MELATONIN_HOURS_BEFORE_BED}h before bed). Low doses (0.5mg) are as effective as higher doses for phase-shifting.`;
    rationale = 'Melatonin taken in late afternoon/early evening advances your circadian phase. Combined with morning light, effects are additive - research shows this combination produces the largest phase shifts.';
  } else {
    // Westward: take melatonin in morning to delay
    // Research: max delay at ~3.5h after habitual wake
    melatoninTime = decimalToTime((timeToDecimal(currentBedtime) - 8 + 3.5 + 24) % 24);
    description = `Take ${dose}mg melatonin in the morning (~${melatoninTime}). This helps delay your clock for westward travel.`;
    rationale = 'Morning melatonin causes phase delays. For westward travel, this helps your body stay awake later.';
  }

  const details: MelatoninInterventionDetails = {
    type: 'melatonin',
    dose,
    timing: melatoninTime,
    formulation: 'immediate',
  };

  return {
    id: generateId(),
    type: 'melatonin',
    startTime: melatoninTime,
    endTime: null,
    duration: null,
    title: 'Melatonin',
    description,
    rationale,
    details,
    priority: direction === 'eastward' ? 'recommended' : 'optional',
    completed: false,
    skipped: false,
  };
}

/**
 * Generate creatine intervention for cognitive support
 */
function generateCreatineIntervention(
  currentWakeTime: string,
  dose: number,
  detailedPhase: DetailedPhase
): Intervention {
  const wakeDecimal = timeToDecimal(currentWakeTime);
  const creatineTime = decimalToTime(wakeDecimal + 1); // 1h after waking, with breakfast

  let description = `Take ${dose}g creatine with breakfast (~${creatineTime}). Stay well hydrated throughout the day.`;

  if (detailedPhase === 'arrival_day') {
    description += ' Research shows creatine significantly improves cognitive performance during sleep deprivation.';
  }

  const details: CreatineInterventionDetails = {
    type: 'creatine',
    dose,
    timing: creatineTime,
    withMeal: true,
  };

  return {
    id: generateId(),
    type: 'creatine',
    startTime: creatineTime,
    endTime: null,
    duration: null,
    title: 'Creatine',
    description,
    rationale: 'A 2024 study showed creatine improves processing speed by 24.5% and short-term memory during sleep deprivation. It supports brain energy metabolism via phosphocreatine, helping maintain mental clarity while adjusting.',
    details,
    priority: detailedPhase === 'arrival_day' || detailedPhase === 'active_adjustment' ? 'recommended' : 'optional',
    completed: false,
    skipped: false,
  };
}

/**
 * Generate meal interventions with organ clock messaging
 */
function generateMealInterventions(
  currentWakeTime: string,
  currentBedtime: string,
  direction: TripDirection,
  detailedPhase: DetailedPhase
): Intervention[] {
  const interventions: Intervention[] = [];
  const wakeDecimal = timeToDecimal(currentWakeTime);
  const bedDecimal = timeToDecimal(currentBedtime);

  // Breakfast - anchor meal for liver and gut clocks
  const breakfastTime = decimalToTime(wakeDecimal + 0.5);
  interventions.push({
    id: generateId(),
    type: 'meal',
    startTime: breakfastTime,
    endTime: null,
    duration: 30,
    title: 'Breakfast (Anchor Meal)',
    description: `Eat a protein-rich breakfast at ${breakfastTime}. This is your most important meal for circadian adjustment - it synchronizes your liver, pancreas, and gut clocks.`,
    rationale: 'Your peripheral organ clocks (liver, gut, pancreas) respond strongly to the first meal of the day. A consistent breakfast helps align your entire circadian system, not just your brain clock.',
    details: {
      type: 'meal',
      mealType: 'breakfast',
      anchorMeal: true,
      composition: 'protein-rich',
      notes: 'Include eggs, yogurt, or protein. Avoid sugary cereals alone.',
    } as MealInterventionDetails,
    priority: 'recommended',
    completed: false,
    skipped: false,
  });

  // Lunch
  const lunchTime = decimalToTime(wakeDecimal + 5);
  interventions.push({
    id: generateId(),
    type: 'meal',
    startTime: lunchTime,
    endTime: null,
    duration: 45,
    title: 'Lunch',
    description: `Lunch at ${lunchTime}. Maintain consistent meal spacing.`,
    rationale: 'Regular meal timing maintains metabolic circadian rhythms.',
    details: {
      type: 'meal',
      mealType: 'lunch',
      anchorMeal: false,
      composition: 'balanced',
      notes: 'Balanced with protein, carbs, vegetables.',
    } as MealInterventionDetails,
    priority: 'optional',
    completed: false,
    skipped: false,
  });

  // Dinner - early to not disrupt sleep
  const dinnerTime = decimalToTime(bedDecimal - 3.5);
  interventions.push({
    id: generateId(),
    type: 'meal',
    startTime: dinnerTime,
    endTime: null,
    duration: 60,
    title: 'Dinner (Early)',
    description: `Finish dinner by ${dinnerTime}. This gives your digestive system time to wind down.`,
    rationale: 'Late eating causes internal desynchrony - your gut and liver clocks get stuck while your brain clock advances. Early dinner improves sleep quality and accelerates adjustment.',
    details: {
      type: 'meal',
      mealType: 'dinner',
      anchorMeal: false,
      composition: 'light',
      notes: 'Moderate portions. Avoid heavy, fatty foods.',
    } as MealInterventionDetails,
    priority: 'recommended',
    completed: false,
    skipped: false,
  });

  return interventions;
}

/**
 * Generate exercise intervention with chronotype-specific guidance
 * Research: Morning exercise causes phase advance for ALL chronotypes
 * Evening exercise causes delays for morning types but advances for evening types
 */
function generateExerciseIntervention(
  direction: TripDirection,
  chronotype: ChronotypeCategory,
  currentWakeTime: string,
  currentBedtime: string,
  detailedPhase: DetailedPhase
): Intervention {
  const wakeDecimal = timeToDecimal(currentWakeTime);
  const bedDecimal = timeToDecimal(currentBedtime);

  let exerciseStart: string;
  let exerciseEnd: string;
  let title: string;
  let description: string;
  let rationale: string;
  let exerciseType: string;
  let intensity: 'light' | 'moderate' | 'vigorous';
  let hrZone: string;

  // For eastward travel, ALWAYS use morning exercise (advances all chronotypes)
  // For westward travel, use late afternoon/evening
  if (direction === 'eastward') {
    exerciseStart = decimalToTime(wakeDecimal + 1);
    exerciseEnd = decimalToTime(wakeDecimal + 2.5);
    title = 'Morning Exercise (Phase Advance)';
    exerciseType = 'Moderate cardio (walking, cycling, swimming)';
    intensity = detailedPhase === 'arrival_day' ? 'light' : 'moderate';
    hrZone = '60-75% max HR (Zone 2-3)';

    description = `Exercise ${exerciseStart}-${exerciseEnd}. ${exerciseType} at ${hrZone}. Outdoor is ideal - combines exercise + light.`;
    rationale = 'Research (Youngstedt 2019): Morning exercise causes ~0.6h phase advance for ALL chronotypes. Combined with morning light, this reinforces eastward adjustment.';

    // Warning for evening chronotypes
    if (chronotype === 'moderate_evening' || chronotype === 'definite_evening') {
      description += ' As an evening type, morning exercise will feel harder but is especially beneficial for phase advancing.';
    }
  } else {
    // Westward - late afternoon/evening exercise
    exerciseStart = decimalToTime(bedDecimal - 5);
    exerciseEnd = decimalToTime(bedDecimal - 3);
    title = 'Late Afternoon Exercise (Phase Delay)';
    exerciseType = 'Moderate cardio';
    intensity = 'moderate';
    hrZone = '60-75% max HR';

    description = `Exercise ${exerciseStart}-${exerciseEnd}. ${exerciseType} at ${hrZone}. Stop at least 3h before bed.`;
    rationale = 'Research: Evening exercise (7-10 PM) causes phase delays. However, for morning chronotypes, evening exercise may cause LESS delay or even advance - morning types should consider afternoon instead.';

    // Warning for morning chronotypes
    if (chronotype === 'moderate_morning' || chronotype === 'definite_morning') {
      const afternoonTime = decimalToTime(Math.max(13, bedDecimal - 7));
      description += ` As a morning type, you may benefit more from early afternoon exercise (~${afternoonTime}) which also causes delays.`;
    }
  }

  // Reduced intensity for arrival day
  if (detailedPhase === 'arrival_day') {
    intensity = 'light';
    hrZone = '50-60% max HR (Zone 1-2)';
    description += ' Keep intensity light today - your body is still adjusting.';
  }

  const details: ExerciseInterventionDetails = {
    type: 'exercise',
    intensity,
    preferredTiming: direction === 'eastward' ? 'morning' : 'evening',
    duration: 30,
    outdoorPreferred: true,
    examples: [
      '30 min brisk walk outdoors',
      'Light jog or cycling',
      'Swimming',
      `Target: ${hrZone}`,
    ],
  };

  return {
    id: generateId(),
    type: 'exercise',
    startTime: exerciseStart,
    endTime: exerciseEnd,
    duration: 30,
    title,
    description,
    rationale,
    details,
    priority: 'recommended',
    completed: false,
    skipped: false,
  };
}

/**
 * Flight Timeline Calculator
 * Calculates specific intervention times based on actual departure/arrival
 */
interface FlightTimeline {
  // Origin times (local)
  departureLocalTime: string;      // e.g., "19:00"
  departureLocalHour: number;      // e.g., 19

  // Destination times (local)
  arrivalLocalTime: string;        // e.g., "14:30"
  arrivalLocalHour: number;

  // Flight phases (in hours from departure)
  boardingStart: number;           // -0.5h (30 min before)
  takeoff: number;                 // 0h
  firstMealService: number;        // ~1.5h after takeoff
  cruiseStart: number;             // ~2h after takeoff
  secondMealService: number;       // ~1.5h before landing
  descentStart: number;            // ~0.5h before landing
  landing: number;                 // flightDuration

  // What time it is at destination during each phase
  destTimeAtDeparture: number;     // destination hour when you depart
  destTimeAtArrival: number;       // destination hour when you arrive
}

/**
 * Calculate flight timeline with all relevant markers
 */
function calculateFlightTimeline(trip: Trip): FlightTimeline {
  const departureDate = new Date(trip.departureDateTime);
  const arrivalDate = new Date(trip.arrivalDateTime);

  const departureLocalHour = departureDate.getHours() + departureDate.getMinutes() / 60;
  const arrivalLocalHour = arrivalDate.getHours() + arrivalDate.getMinutes() / 60;

  const flightDurationHours = trip.flightDuration / 60;

  // Calculate destination time at departure
  // If you depart at 19:00 origin and destination is +9h ahead, it's 04:00 there
  const destTimeAtDeparture = (departureLocalHour + trip.timezoneShiftHours + 24) % 24;

  return {
    departureLocalTime: decimalToTime(departureLocalHour),
    departureLocalHour,
    arrivalLocalTime: decimalToTime(arrivalLocalHour),
    arrivalLocalHour,

    boardingStart: -0.5,
    takeoff: 0,
    firstMealService: Math.min(1.5, flightDurationHours * 0.15), // First meal ~1.5h or 15% into flight
    cruiseStart: 2,
    secondMealService: flightDurationHours - 1.5, // Second meal 1.5h before landing
    descentStart: flightDurationHours - 0.5,
    landing: flightDurationHours,

    destTimeAtDeparture,
    destTimeAtArrival: arrivalLocalHour,
  };
}

/**
 * Determine if a time falls in "night" hours (22:00-06:00)
 */
function isNightTime(hour: number): boolean {
  return hour >= 22 || hour < 6;
}

/**
 * Determine if a time falls in "sleep window" for circadian purposes (21:00-07:00)
 */
function isSleepWindow(hour: number): boolean {
  return hour >= 21 || hour < 7;
}

/**
 * Calculate destination time at a point during flight
 */
function getDestTimeAtFlightPoint(
  departureLocalHour: number,
  hoursIntoFlight: number,
  timezoneShift: number
): number {
  // Current origin time + timezone shift = destination time
  const originTimeNow = departureLocalHour + hoursIntoFlight;
  return (originTimeNow + timezoneShift + 24) % 24;
}

/**
 * Generate specific nap window based on science
 * - 20 min power nap: Light sleep only, no grogginess
 * - 90 min full cycle: Complete sleep cycle, wake refreshed
 * - 30-80 min "danger zone": Wake during deep sleep = grogginess
 */
interface NapWindow {
  startTime: string;         // Origin local time
  endTime: string;
  duration: 20 | 90;         // Only these two durations are scientifically optimal
  type: 'power' | 'full_cycle';
  destTimeEquivalent: string; // What time it is at destination
  rationale: string;
}

/**
 * Generate flight-day specific interventions v4.0
 *
 * Based on Timeshifter methodology and circadian science:
 * 1. Calculate exact times based on departure/arrival
 * 2. Determine optimal sleep windows based on destination time
 * 3. Calculate airline meal times and whether to eat/skip
 * 4. Provide specific light exposure/avoidance windows
 * 5. Time melatonin precisely
 */
function generateFlightDayInterventions(
  trip: Trip,
  currentBedtime: string,
  currentWakeTime: string,
  preferences: UserPreferences,
  currentCBTmin: string
): Intervention[] {
  const interventions: Intervention[] = [];
  const timeline = calculateFlightTimeline(trip);
  const flightDurationHours = trip.flightDuration / 60;
  const flightDurationMinutes = trip.flightDuration;

  // Pre-departure wake time (origin local)
  const wakeDecimal = timeToDecimal(currentWakeTime);
  const bedDecimal = timeToDecimal(currentBedtime);

  // ============================================================
  // 1. PRE-BOARDING: Morning of flight (origin time)
  // ============================================================

  // Morning light exposure before departure (if departing afternoon/evening)
  if (timeline.departureLocalHour >= 12) {
    interventions.push({
      id: generateId(),
      type: 'light_exposure',
      startTime: currentWakeTime,
      endTime: decimalToTime(wakeDecimal + 2),
      duration: 60,
      title: 'Morning Light Before Flight',
      description: trip.direction === 'eastward'
        ? `Get 30-60 min bright outdoor light from ${currentWakeTime}. This starts your phase advance before you even board.`
        : `Light exposure ${currentWakeTime}-${decimalToTime(wakeDecimal + 2)} is fine. For westward travel, you want evening light at destination.`,
      rationale: trip.direction === 'eastward'
        ? 'Morning light advances your circadian clock. Starting this before a late flight gives you a head start on eastward adjustment.'
        : 'Morning light has minimal impact on westward travel plans. Enjoy your morning normally.',
      details: {
        type: 'light_exposure',
        intensity: trip.direction === 'eastward' ? 'bright' : 'any',
        source: 'outdoor',
        luxTarget: 10000,
        blueBlockersRecommended: false,
        outdoorPreferred: true,
      } as LightInterventionDetails,
      priority: trip.direction === 'eastward' ? 'recommended' : 'optional',
      completed: false,
      skipped: false,
    });
  }

  // ============================================================
  // 2. BOARDING: Set mental clock to destination
  // ============================================================

  const boardingTime = decimalToTime((timeline.departureLocalHour - 0.5 + 24) % 24);
  const destTimeAtBoarding = decimalToTime(
    getDestTimeAtFlightPoint(timeline.departureLocalHour, -0.5, trip.timezoneShiftHours)
  );

  interventions.push({
    id: generateId(),
    type: 'light_exposure', // Using light type for "mindset" intervention
    startTime: boardingTime,
    endTime: timeline.departureLocalTime,
    duration: 30,
    title: 'Set Mental Clock to Destination',
    description: `At boarding (${boardingTime}), set your watch and phone to destination time. It's ${destTimeAtBoarding} at your destination right now. From now on, think "What time is it THERE?"`,
    rationale: 'Mental reframing accelerates circadian adjustment. All sleep, eat, and light decisions should be based on destination time.',
    details: {
      type: 'light_exposure',
      intensity: 'any',
      source: 'any',
      luxTarget: 0,
      blueBlockersRecommended: false,
      outdoorPreferred: false,
    } as LightInterventionDetails,
    priority: 'critical',
    completed: false,
    skipped: false,
  });

  // ============================================================
  // 3. IN-FLIGHT SLEEP STRATEGY (Specific windows)
  // ============================================================

  if (flightDurationMinutes >= 240) { // 4+ hour flights
    // Calculate optimal sleep windows based on when it's night at destination
    const sleepWindows: NapWindow[] = [];

    // Check each hour of the flight for sleep opportunities
    for (let hoursIn = 0; hoursIn < flightDurationHours; hoursIn += 0.5) {
      const destTime = getDestTimeAtFlightPoint(
        timeline.departureLocalHour,
        hoursIn,
        trip.timezoneShiftHours
      );

      // If it's nighttime at destination (21:00-07:00), this is a sleep opportunity
      if (isSleepWindow(destTime) && sleepWindows.length < 2) {
        const originTimeStart = (timeline.departureLocalHour + hoursIn + 24) % 24;

        // Determine if we have time for a full 90-min cycle or just 20-min power nap
        const remainingFlight = flightDurationHours - hoursIn;
        const duration: 20 | 90 = remainingFlight >= 2 ? 90 : 20;

        sleepWindows.push({
          startTime: decimalToTime(originTimeStart),
          endTime: decimalToTime((originTimeStart + duration / 60 + 24) % 24),
          duration,
          type: duration === 90 ? 'full_cycle' : 'power',
          destTimeEquivalent: decimalToTime(destTime),
          rationale: duration === 90
            ? 'A 90-minute nap completes one full sleep cycle, minimizing grogginess on waking.'
            : 'A 20-minute power nap stays in light sleep, avoiding grogginess from deep sleep interruption.',
        });

        // Skip ahead to avoid overlapping windows
        hoursIn += duration / 60;
      }
    }

    // Generate interventions for each sleep window
    if (sleepWindows.length > 0) {
      const primarySleep = sleepWindows[0];
      const destNightStart = decimalToTime(getDestTimeAtFlightPoint(
        timeline.departureLocalHour,
        0,
        trip.timezoneShiftHours
      ));

      let sleepDescription = '';

      if (primarySleep.duration === 90) {
        sleepDescription = `**SLEEP NOW (${primarySleep.startTime}-${primarySleep.endTime})**: It's ${primarySleep.destTimeEquivalent} at your destination - nighttime. Take a ${primarySleep.duration}-minute sleep to complete one full sleep cycle. Use eye mask + earplugs.`;
      } else {
        sleepDescription = `**20-MIN POWER NAP (${primarySleep.startTime}-${primarySleep.endTime})**: It's ${primarySleep.destTimeEquivalent} at destination. Limited time for sleep - take a 20-minute power nap only. Set alarm to avoid grogginess.`;
      }

      interventions.push({
        id: generateId(),
        type: 'sleep',
        startTime: primarySleep.startTime,
        endTime: primarySleep.endTime,
        duration: primarySleep.duration,
        title: primarySleep.type === 'full_cycle' ? 'In-Flight Sleep (90 min)' : 'Power Nap (20 min)',
        description: sleepDescription,
        rationale: `${primarySleep.rationale} Sleep equals dark for your circadian clock - sleeping when it's night at destination accelerates adjustment.`,
        details: {
          type: 'sleep',
          targetBedtime: primarySleep.startTime,
          targetWakeTime: primarySleep.endTime,
          sleepDuration: primarySleep.duration,
          napAllowed: true,
          napWindow: {
            start: primarySleep.startTime,
            end: primarySleep.endTime,
            maxDuration: primarySleep.duration,
          },
        } as SleepInterventionDetails,
        priority: 'critical',
        completed: false,
        skipped: false,
      });

      // Add second sleep window if available
      if (sleepWindows.length > 1) {
        const secondSleep = sleepWindows[1];
        interventions.push({
          id: generateId(),
          type: 'sleep',
          startTime: secondSleep.startTime,
          endTime: secondSleep.endTime,
          duration: secondSleep.duration,
          title: 'Additional Sleep Window',
          description: `If you didn't sleep earlier, another opportunity: ${secondSleep.startTime}-${secondSleep.endTime} (${secondSleep.duration} min). It's ${secondSleep.destTimeEquivalent} at destination.`,
          rationale: secondSleep.rationale,
          details: {
            type: 'sleep',
            targetBedtime: secondSleep.startTime,
            targetWakeTime: secondSleep.endTime,
            sleepDuration: secondSleep.duration,
            napAllowed: true,
          } as SleepInterventionDetails,
          priority: 'optional',
          completed: false,
          skipped: false,
        });
      }
    }

    // Generate STAY AWAKE intervention for destination daytime
    const stayAwakeWindows: { start: number; end: number; destStart: number; destEnd: number }[] = [];

    for (let hoursIn = 0; hoursIn < flightDurationHours; hoursIn += 1) {
      const destTime = getDestTimeAtFlightPoint(
        timeline.departureLocalHour,
        hoursIn,
        trip.timezoneShiftHours
      );

      // If it's daytime at destination (08:00-20:00), stay awake
      if (destTime >= 8 && destTime <= 20) {
        const originTime = (timeline.departureLocalHour + hoursIn + 24) % 24;
        if (stayAwakeWindows.length === 0 ||
            originTime - stayAwakeWindows[stayAwakeWindows.length - 1].end > 1) {
          stayAwakeWindows.push({
            start: originTime,
            end: Math.min(originTime + 3, timeline.departureLocalHour + flightDurationHours),
            destStart: destTime,
            destEnd: Math.min(destTime + 3, 20),
          });
        } else {
          // Extend previous window
          stayAwakeWindows[stayAwakeWindows.length - 1].end = originTime + 1;
          stayAwakeWindows[stayAwakeWindows.length - 1].destEnd = destTime + 1;
        }
      }
    }

    if (stayAwakeWindows.length > 0) {
      const window = stayAwakeWindows[0];
      const startTime = decimalToTime(window.start % 24);
      const endTime = decimalToTime(window.end % 24);
      const destStartTime = decimalToTime(window.destStart);
      const destEndTime = decimalToTime(window.destEnd);

      interventions.push({
        id: generateId(),
        type: 'light_exposure',
        startTime,
        endTime,
        duration: null,
        title: 'Stay Awake Period',
        description: `**STAY AWAKE (${startTime}-${endTime})**: It's ${destStartTime}-${destEndTime} at destination - daytime. Keep cabin lights on, watch movies, read. DO NOT sleep during this window.`,
        rationale: 'Sleeping when it\'s daytime at destination will shift your clock the WRONG direction, making jet lag worse.',
        details: {
          type: 'light_exposure',
          intensity: 'bright',
          source: 'cabin_lights',
          luxTarget: 500,
          blueBlockersRecommended: false,
          outdoorPreferred: false,
        } as LightInterventionDetails,
        priority: 'critical',
        completed: false,
        skipped: false,
      });
    }
  }

  // ============================================================
  // 4. IN-FLIGHT MEAL TIMING (Based on airline service + destination time)
  // ============================================================

  // Airlines typically serve:
  // - First meal: 1-1.5h after takeoff
  // - Second meal (long-haul): 1.5h before landing

  const firstMealOriginTime = (timeline.departureLocalHour + 1.5 + 24) % 24;
  const firstMealDestTime = getDestTimeAtFlightPoint(
    timeline.departureLocalHour,
    1.5,
    trip.timezoneShiftHours
  );

  // Determine if you should eat the first meal
  const firstMealDuringDestDay = firstMealDestTime >= 6 && firstMealDestTime <= 21;
  const firstMealAction = firstMealDuringDestDay ? 'EAT' : 'SKIP or eat light';

  interventions.push({
    id: generateId(),
    type: 'meal',
    startTime: decimalToTime(firstMealOriginTime),
    endTime: decimalToTime((firstMealOriginTime + 0.5) % 24),
    duration: 30,
    title: 'First In-Flight Meal',
    description: `**${firstMealAction}** when airline serves (~${decimalToTime(firstMealOriginTime)}). It's ${decimalToTime(firstMealDestTime)} at destination. ${
      firstMealDuringDestDay
        ? 'Destination daytime = eat normally.'
        : 'Destination nighttime = skip or just have a light snack. Your gut clock needs to rest.'
    }`,
    rationale: 'Your liver and gut clocks respond to meal timing. Eating during destination nighttime causes internal desynchrony.',
    details: {
      type: 'meal',
      mealType: firstMealDuringDestDay ? 'meal' : 'snack',
      anchorMeal: false,
      composition: firstMealDuringDestDay ? 'balanced' : 'light',
      notes: firstMealDuringDestDay
        ? 'Normal meal is fine - it aligns with destination meal time.'
        : 'If you must eat, choose light protein. Avoid carb-heavy airline meals.',
    } as MealInterventionDetails,
    priority: firstMealDuringDestDay ? 'recommended' : 'optional',
    completed: false,
    skipped: false,
  });

  // Second meal for long-haul flights (8h+)
  if (flightDurationHours >= 8) {
    const secondMealOriginTime = (timeline.departureLocalHour + flightDurationHours - 1.5 + 24) % 24;
    const secondMealDestTime = getDestTimeAtFlightPoint(
      timeline.departureLocalHour,
      flightDurationHours - 1.5,
      trip.timezoneShiftHours
    );

    const secondMealDuringDestDay = secondMealDestTime >= 6 && secondMealDestTime <= 21;
    const secondMealAction = secondMealDuringDestDay ? 'EAT' : 'SKIP or eat light';

    interventions.push({
      id: generateId(),
      type: 'meal',
      startTime: decimalToTime(secondMealOriginTime),
      endTime: decimalToTime((secondMealOriginTime + 0.5) % 24),
      duration: 30,
      title: 'Second In-Flight Meal (Pre-Landing)',
      description: `**${secondMealAction}** when airline serves (~${decimalToTime(secondMealOriginTime)}). It's ${decimalToTime(secondMealDestTime)} at destination. ${
        secondMealDuringDestDay
          ? 'This is breakfast/lunch at destination - eat well!'
          : 'Still night at destination - keep it light or skip.'
      }`,
      rationale: 'The pre-arrival meal can serve as your first "anchor meal" in destination time if timed right.',
      details: {
        type: 'meal',
        mealType: secondMealDuringDestDay ? 'meal' : 'snack',
        anchorMeal: secondMealDuringDestDay,
        composition: secondMealDuringDestDay ? 'protein-rich' : 'light',
        notes: secondMealDuringDestDay
          ? 'Great opportunity to anchor your peripheral clocks to destination time.'
          : 'Skip if possible. If you ate the previous meal, fasting now helps.',
      } as MealInterventionDetails,
      priority: secondMealDuringDestDay ? 'recommended' : 'optional',
      completed: false,
      skipped: false,
    });
  }

  // ============================================================
  // 5. IN-FLIGHT CAFFEINE (Specific timing)
  // ============================================================

  if (preferences.caffeineUser) {
    // Calculate when caffeine is appropriate
    // OK during destination morning/early afternoon (06:00-14:00 dest time)
    // Avoid within 8h of destination bedtime

    const caffeineWindows: { start: number; end: number; destStart: number; destEnd: number }[] = [];

    for (let hoursIn = 0; hoursIn < flightDurationHours; hoursIn += 1) {
      const destTime = getDestTimeAtFlightPoint(
        timeline.departureLocalHour,
        hoursIn,
        trip.timezoneShiftHours
      );

      // Caffeine OK from 6 AM to 2 PM destination time
      if (destTime >= 6 && destTime <= 14) {
        const originTime = (timeline.departureLocalHour + hoursIn + 24) % 24;
        caffeineWindows.push({
          start: originTime,
          end: originTime + 1,
          destStart: destTime,
          destEnd: destTime + 1,
        });
      }
    }

    if (caffeineWindows.length > 0) {
      // Consolidate windows
      const firstWindow = caffeineWindows[0];
      const lastWindow = caffeineWindows[caffeineWindows.length - 1];

      const caffeineStartTime = decimalToTime(firstWindow.start % 24);
      const caffeineEndTime = decimalToTime(lastWindow.end % 24);
      const destCaffeineStart = decimalToTime(firstWindow.destStart);
      const destCaffeineEnd = decimalToTime(lastWindow.destEnd);

      interventions.push({
        id: generateId(),
        type: 'caffeine',
        startTime: caffeineStartTime,
        endTime: caffeineEndTime,
        duration: null,
        title: 'Caffeine Window',
        description: `**CAFFEINE OK (${caffeineStartTime}-${caffeineEndTime})**: It's ${destCaffeineStart}-${destCaffeineEnd} at destination. Coffee/tea is fine during this window. After ${caffeineEndTime}, NO more caffeine.`,
        rationale: 'Caffeine has a 5-6h half-life. Drinking after 2 PM destination time will impair your sleep at destination.',
        details: {
          type: 'caffeine',
          allowed: true,
          cutoffTime: caffeineEndTime,
          maxIntakeBeforeCutoff: '200mg (2 cups)',
          recommendedTimes: [caffeineStartTime],
        } as CaffeineInterventionDetails,
        priority: 'recommended',
        completed: false,
        skipped: false,
      });
    } else {
      // No good caffeine window - entire flight is during destination evening/night
      interventions.push({
        id: generateId(),
        type: 'caffeine',
        startTime: timeline.departureLocalTime,
        endTime: null,
        duration: null,
        title: 'No Caffeine During Flight',
        description: `**AVOID CAFFEINE**: Your entire flight occurs during destination evening/night. Caffeine now will ruin your sleep at arrival. Switch to water or herbal tea.`,
        rationale: 'Your body thinks it\'s late evening/night. Caffeine will prevent the sleep you need for adjustment.',
        details: {
          type: 'caffeine',
          allowed: false,
          cutoffTime: timeline.departureLocalTime,
          maxIntakeBeforeCutoff: '0mg',
          recommendedTimes: [],
        } as CaffeineInterventionDetails,
        priority: 'recommended',
        completed: false,
        skipped: false,
      });
    }
  }

  // ============================================================
  // 6. IN-FLIGHT MELATONIN (Precise timing for eastward)
  // ============================================================

  if (preferences.usesMelatonin && trip.direction === 'eastward') {
    // For eastward travel, take melatonin when it's ~5h before destination bedtime
    // This is typically mid-flight for long-haul eastward
    const destBedtime = timeToDecimal(currentBedtime); // e.g., 23:00 = 23

    for (let hoursIn = 0; hoursIn < flightDurationHours; hoursIn += 0.5) {
      const destTime = getDestTimeAtFlightPoint(
        timeline.departureLocalHour,
        hoursIn,
        trip.timezoneShiftHours
      );

      // Look for ~5.5h before destination bedtime (17:30 if bed at 23:00)
      const hoursBeforeBed = (destBedtime - destTime + 24) % 24;
      if (hoursBeforeBed >= 5 && hoursBeforeBed <= 6) {
        const melatoninOriginTime = decimalToTime((timeline.departureLocalHour + hoursIn + 24) % 24);

        interventions.push({
          id: generateId(),
          type: 'melatonin',
          startTime: melatoninOriginTime,
          endTime: null,
          duration: null,
          title: 'Take Melatonin Now',
          description: `**MELATONIN at ${melatoninOriginTime}**: Take ${preferences.melatoninDose}mg fast-release melatonin. It's ${decimalToTime(destTime)} at destination (~${Math.round(hoursBeforeBed)}h before bed). This is the optimal phase-advance timing.`,
          rationale: 'Melatonin 5-6h before bed produces maximum phase advance. Fast-release (not slow-release) for phase shifting. Research shows 0.5-3mg is effective.',
          details: {
            type: 'melatonin',
            dose: preferences.melatoninDose,
            timing: melatoninOriginTime,
            formulation: 'immediate', // CRITICAL: fast-release, not slow-release
          } as MelatoninInterventionDetails,
          priority: 'recommended',
          completed: false,
          skipped: false,
        });
        break;
      }
    }
  }

  // ============================================================
  // 7. LIGHT MANAGEMENT (Eye mask vs screens)
  // ============================================================

  // Add specific light avoidance for eastward travel during pre-CBTmin window
  if (trip.direction === 'eastward') {
    // Find when it's 3h before destination CBTmin (avoid light then)
    const cbtMinDestHour = timeToDecimal(currentCBTmin); // e.g., 4:00

    for (let hoursIn = 0; hoursIn < flightDurationHours; hoursIn += 1) {
      const destTime = getDestTimeAtFlightPoint(
        timeline.departureLocalHour,
        hoursIn,
        trip.timezoneShiftHours
      );

      // 3h window before CBTmin is CRITICAL to avoid light
      const hoursBeforeCBTmin = (cbtMinDestHour - destTime + 24) % 24;
      if (hoursBeforeCBTmin <= 3 && hoursBeforeCBTmin >= 0) {
        const avoidLightStart = decimalToTime((timeline.departureLocalHour + hoursIn + 24) % 24);
        const avoidLightEnd = decimalToTime((timeline.departureLocalHour + hoursIn + 2 + 24) % 24);

        interventions.push({
          id: generateId(),
          type: 'light_avoidance',
          startTime: avoidLightStart,
          endTime: avoidLightEnd,
          duration: null,
          title: 'Critical: Avoid Light Now',
          description: `**WEAR EYE MASK (${avoidLightStart}-${avoidLightEnd})**: It's ${decimalToTime(destTime)} at destination - just before your CBTmin. Light now would cause a phase DELAY (wrong direction!). Use eye mask, dim cabin lights.`,
          rationale: 'Light in the 3h before your core body temperature minimum causes phase delays. For eastward travel, this is the OPPOSITE of what you want.',
          details: {
            type: 'light_avoidance',
            intensity: 'dark',
            source: 'eye_mask',
            luxTarget: 0,
            blueBlockersRecommended: true,
            outdoorPreferred: false,
          } as LightInterventionDetails,
          priority: 'critical',
          completed: false,
          skipped: false,
        });
        break;
      }
    }
  }

  // ============================================================
  // 8. POST-ARRIVAL GUIDANCE
  // ============================================================

  const arrivalDestTime = timeline.arrivalLocalHour;
  const isArrivalMorning = arrivalDestTime >= 6 && arrivalDestTime <= 12;
  const isArrivalAfternoon = arrivalDestTime > 12 && arrivalDestTime <= 18;
  const isArrivalEvening = arrivalDestTime > 18 || arrivalDestTime < 6;

  let arrivalGuidance = '';
  if (isArrivalMorning) {
    arrivalGuidance = trip.direction === 'eastward'
      ? `Arriving ${timeline.arrivalLocalTime} (morning) - PERFECT. Get bright outdoor light immediately. This is your biggest adjustment opportunity.`
      : `Arriving ${timeline.arrivalLocalTime} (morning) - Wear sunglasses for 2h to avoid advancing when you need to delay.`;
  } else if (isArrivalAfternoon) {
    arrivalGuidance = `Arriving ${timeline.arrivalLocalTime} (afternoon) - Stay active until local bedtime. ${trip.direction === 'eastward' ? 'Avoid late naps.' : 'Get evening light.'}`;
  } else {
    arrivalGuidance = `Arriving ${timeline.arrivalLocalTime} (evening) - Push to local bedtime if possible. ${trip.direction === 'eastward' ? 'Take melatonin 30 min before bed.' : 'Brief evening light then dim for bed.'}`;
  }

  interventions.push({
    id: generateId(),
    type: 'light_exposure',
    startTime: timeline.arrivalLocalTime,
    endTime: decimalToTime((arrivalDestTime + 2) % 24),
    duration: null,
    title: 'Arrival Strategy',
    description: arrivalGuidance,
    rationale: 'Your first hours at destination set the tone for adjustment. Following the right light/dark protocol immediately accelerates adaptation.',
    details: {
      type: 'light_exposure',
      intensity: isArrivalMorning && trip.direction === 'eastward' ? 'bright' : 'any',
      source: 'outdoor',
      luxTarget: 10000,
      blueBlockersRecommended: isArrivalMorning && trip.direction === 'westward',
      outdoorPreferred: true,
    } as LightInterventionDetails,
    priority: 'critical',
    completed: false,
    skipped: false,
  });

  // Sort interventions by actual time
  interventions.sort((a, b) => {
    // Special handling for mental clock intervention (always first)
    if (a.title.includes('Set Mental Clock')) return -1;
    if (b.title.includes('Set Mental Clock')) return 1;

    const aTime = timeToDecimal(a.startTime);
    const bTime = timeToDecimal(b.startTime);

    // Handle day wrap-around
    const aNormalized = aTime < timeline.departureLocalHour - 1 ? aTime + 24 : aTime;
    const bNormalized = bTime < timeline.departureLocalHour - 1 ? bTime + 24 : bTime;

    return aNormalized - bNormalized;
  });

  return interventions;
}

/**
 * Generate arrival day tips with organ clock information
 */
function generateArrivalDayTips(
  direction: TripDirection,
  timezoneShift: number
): string[] {
  const tips: string[] = [];

  tips.push('Multiple body clocks need alignment: Your brain (SCN) adjusts fastest via light (~1-2 days), while your liver, gut, and muscle clocks take 3-5 days via meals and exercise.');

  if (direction === 'eastward') {
    tips.push('CRITICAL: Get morning light even if exhausted. This is the single most powerful intervention.');
    tips.push('Eat breakfast at local time even if not hungry - your gut and liver need this timing signal.');
    tips.push('Avoid napping before 2 PM local time. If you must nap, limit to 20 minutes.');
  } else {
    tips.push('Seek evening light to delay your clock. Stay active until local bedtime.');
    tips.push('If you arrived in the evening, push through to local bedtime.');
    tips.push('A short nap (20 min max) is OK if struggling, but not within 5h of bedtime.');
  }

  if (Math.abs(timezoneShift) >= 8) {
    tips.push(`Large shift (${Math.abs(timezoneShift)}h): Expect 5-7 days for full adjustment. Your gut and liver will feel "off" for several days - this is normal.`);
  }

  return tips;
}

/**
 * Generate day summary
 */
function generateDaySummary(
  dayNumber: number,
  detailedPhase: DetailedPhase,
  direction: TripDirection,
  progressPercent: number
): string {
  switch (detailedPhase) {
    case 'pre_adjustment':
      const shiftDir = direction === 'eastward' ? 'earlier' : 'later';
      return `Pre-Departure Day ${Math.abs(dayNumber)}: Shift sleep/meals 30 min ${shiftDir}. Light and melatonin as scheduled.`;
    case 'flight_day':
      return 'Travel Day: Think in destination time. Sleep/eat according to destination schedule.';
    case 'arrival_day':
      return 'Arrival Day: Commit fully to local time. Morning light is critical. Push through fatigue.';
    case 'active_adjustment':
      return `Adjustment Day (${progressPercent}% complete): Stay consistent. ${direction === 'eastward' ? 'Morning light + early meals.' : 'Evening light + later schedule.'}`;
    case 'fine_tuning':
      return 'Fine Tuning: Almost adjusted. Lock in your new rhythm with consistent timing.';
    case 'adjusted':
      return 'Adjusted: Your circadian system is synchronized. Maintain local timing.';
  }
}

/**
 * Generate tips for a protocol day
 */
function generateDayTips(
  detailedPhase: DetailedPhase,
  direction: TripDirection,
  progress: number
): string[] {
  const tips: string[] = [];

  switch (detailedPhase) {
    case 'pre_adjustment':
      tips.push(`Shift schedule by 30 min ${direction === 'eastward' ? 'earlier' : 'later'} today.`);
      tips.push('Move both sleep AND meal times - this coordinates your brain and organ clocks.');
      if (direction === 'eastward') {
        tips.push('Take melatonin in late afternoon to boost phase advance.');
      }
      break;

    case 'active_adjustment':
      if (progress < 50) {
        tips.push('First few days are hardest. Light exposure is your best tool.');
        tips.push('Feeling groggy and having GI issues is normal - organ clocks are catching up.');
      } else {
        tips.push('Past the midpoint! Consistency now locks in your new rhythm.');
      }
      break;

    case 'fine_tuning':
      tips.push('Almost there. Maintain consistent sleep and meal times.');
      tips.push('Your peripheral clocks (liver, gut) are nearly aligned.');
      break;

    case 'adjusted':
      tips.push('Fully adjusted. Keep regular timing to maintain synchronization.');
      break;
  }

  return tips;
}

/**
 * Generate a single protocol day
 */
function generateProtocolDay(
  dayNumber: number,
  date: Date,
  currentDLMO: string,
  currentCBTmin: string,
  targetDLMO: string,
  config: GeneratorConfig,
  trip: Trip,
  circadianProfile: CircadianProfile,
  preferences: UserPreferences,
  detailedPhase: DetailedPhase,
  currentBedtime: string,
  currentWakeTime: string
): ProtocolDay {
  const phase = toProtocolPhase(detailedPhase);
  const timezone = dayNumber <= 0 ? trip.originTimezone : trip.destinationTimezone;

  const interventions: Intervention[] = [];

  // Calculate progress
  const phaseShiftFromHome = Math.abs(calculatePhaseGap(currentDLMO, targetDLMO));
  const totalShiftNeeded = Math.abs(trip.timezoneShiftHours);
  const adjustmentProgress = Math.min(
    100,
    Math.round(((totalShiftNeeded - phaseShiftFromHome) / totalShiftNeeded) * 100)
  );

  // Flight day has special handling
  if (detailedPhase === 'flight_day') {
    interventions.push(
      ...generateFlightDayInterventions(trip, currentBedtime, currentWakeTime, preferences, currentCBTmin)
    );
  } else {
    // Light interventions
    if (config.interventionsEnabled.includes('light_exposure')) {
      interventions.push(
        ...generateLightInterventions(
          currentCBTmin,
          trip.direction,
          currentBedtime,
          currentWakeTime
        )
      );
    }

    // Sleep intervention
    if (config.interventionsEnabled.includes('sleep')) {
      interventions.push(
        generateSleepIntervention(
          currentBedtime,
          currentWakeTime,
          detailedPhase,
          preferences.includeNapGuidance
        )
      );
    }

    // Meal interventions
    if (config.interventionsEnabled.includes('meal')) {
      interventions.push(
        ...generateMealInterventions(
          currentWakeTime,
          currentBedtime,
          trip.direction,
          detailedPhase
        )
      );
    }

    // Exercise intervention with chronotype guidance
    if (config.interventionsEnabled.includes('exercise')) {
      interventions.push(
        generateExerciseIntervention(
          trip.direction,
          circadianProfile.chronotypeCategory,
          currentWakeTime,
          currentBedtime,
          detailedPhase
        )
      );
    }

    // Caffeine intervention (cutoff at 14:00)
    if (config.interventionsEnabled.includes('caffeine') && preferences.caffeineUser) {
      interventions.push(
        generateCaffeineIntervention(currentWakeTime, currentBedtime)
      );
    }

    // Melatonin intervention
    if (config.interventionsEnabled.includes('melatonin') && preferences.usesMelatonin) {
      const melatoninIntervention = generateMelatoninIntervention(
        currentBedtime,
        trip.direction,
        preferences.melatoninDose,
        detailedPhase
      );
      if (melatoninIntervention) {
        interventions.push(melatoninIntervention);
      }
    }

    // Creatine intervention (arrival day and active adjustment)
    if (config.interventionsEnabled.includes('creatine') && preferences.usesCreatine) {
      if (detailedPhase === 'arrival_day' || detailedPhase === 'active_adjustment') {
        interventions.push(
          generateCreatineIntervention(
            currentWakeTime,
            preferences.creatineDose,
            detailedPhase
          )
        );
      }
    }
  }

  // Sort interventions by start time
  interventions.sort((a, b) => {
    if (a.title.includes('Set Watch')) return -1;
    if (b.title.includes('Set Watch')) return 1;
    const aTime = timeToDecimal(a.startTime);
    const bTime = timeToDecimal(b.startTime);
    return aTime - bTime;
  });

  // Generate tips
  let tips: string[];
  if (detailedPhase === 'arrival_day') {
    tips = generateArrivalDayTips(trip.direction, trip.timezoneShiftHours);
  } else {
    tips = generateDayTips(detailedPhase, trip.direction, adjustmentProgress);
  }

  return {
    dayNumber,
    date,
    phase,
    timezone,
    estimatedDLMO: currentDLMO,
    estimatedCBTmin: currentCBTmin,
    phaseShiftFromHome: totalShiftNeeded - phaseShiftFromHome,
    adjustmentProgress,
    interventions,
    summary: generateDaySummary(dayNumber, detailedPhase, trip.direction, adjustmentProgress),
    tips,
  };
}

/**
 * Main protocol generation function
 */
export function generateProtocol(input: ProtocolGeneratorInput): Protocol {
  const { trip, circadianProfile, preferences } = input;

  // Calculate pre-departure days (max 3)
  const preDepartureDays = calculatePreDepartureDays(
    trip.timezoneShiftHours,
    trip.tripDurationDays
  );

  // Determine enabled interventions
  const interventionsEnabled: InterventionType[] = [
    'light_exposure',
    'light_avoidance',
    'sleep',
    'meal',
    'exercise',
  ];

  if (preferences.usesMelatonin) interventionsEnabled.push('melatonin');
  if (preferences.caffeineUser) interventionsEnabled.push('caffeine');
  if (preferences.usesCreatine) interventionsEnabled.push('creatine');

  // Calculate daily shift rate
  const dailyShiftRate = calculateDailyShiftRate(
    circadianProfile.chronotypeCategory,
    trip.direction,
    true
  );

  const estimatedDaysToAdjust = Math.ceil(
    Math.abs(trip.timezoneShiftHours) / dailyShiftRate
  );

  const config: GeneratorConfig = {
    preDepartureDays,
    maxDailyShift: dailyShiftRate,
    maxWakeShiftFromHabitual: MAX_WAKE_SHIFT_HOURS,
    interventionsEnabled,
    targetBedtime: circadianProfile.habitualBedtime,
    targetWakeTime: circadianProfile.habitualWakeTime,
  };

  // Get initial circadian markers
  const initialMarkers = estimateCircadianMarkers({
    meqScore: circadianProfile.meqScore,
    msfsc: circadianProfile.mctqMSFsc
      ? decimalToTime(circadianProfile.mctqMSFsc)
      : undefined,
    habitualBedtime: circadianProfile.habitualBedtime,
    habitualWakeTime: circadianProfile.habitualWakeTime,
  });

  // Calculate target DLMO at destination
  const shiftDirection = determineShiftDirection(trip.timezoneShiftHours);
  const targetDLMO = shiftDLMO(
    initialMarkers.dlmo,
    -trip.timezoneShiftHours
  );

  // Generate all days
  const days: ProtocolDay[] = [];
  const departureDate = new Date(trip.departureDateTime);

  // Track current phase markers
  let currentDLMO = initialMarkers.dlmo;
  let currentCBTmin = initialMarkers.cbtMin;
  let currentBedtime = circadianProfile.habitualBedtime;
  let currentWakeTime = circadianProfile.habitualWakeTime;

  // Pre-departure days (max 3)
  for (let i = -preDepartureDays; i < 0; i++) {
    const date = new Date(departureDate);
    date.setDate(date.getDate() + i);

    const detailedPhase = getDetailedPhase(i, preDepartureDays, estimatedDaysToAdjust);

    days.push(
      generateProtocolDay(
        i,
        date,
        currentDLMO,
        currentCBTmin,
        targetDLMO,
        config,
        trip,
        circadianProfile,
        preferences,
        detailedPhase,
        currentBedtime,
        currentWakeTime
      )
    );

    // Shift 30 min per day during pre-departure
    const dailyPreShift = shiftDirection === 'advance'
      ? -PRE_DEPARTURE_SHIFT_PER_DAY
      : PRE_DEPARTURE_SHIFT_PER_DAY;

    currentDLMO = shiftDLMO(currentDLMO, dailyPreShift);
    currentCBTmin = shiftDLMO(currentCBTmin, dailyPreShift);

    // Shift sleep times with clamping
    const bedDecimal = timeToDecimal(currentBedtime);
    const wakeDecimal = timeToDecimal(currentWakeTime);
    const newBedtime = decimalToTime((bedDecimal + dailyPreShift + 24) % 24);
    const newWakeTime = decimalToTime((wakeDecimal + dailyPreShift + 24) % 24);

    currentBedtime = newBedtime;
    currentWakeTime = clampWakeTime(newWakeTime, circadianProfile.habitualWakeTime, trip.direction);
  }

  // Travel day (day 0)
  days.push(
    generateProtocolDay(
      0,
      departureDate,
      currentDLMO,
      currentCBTmin,
      targetDLMO,
      config,
      trip,
      circadianProfile,
      preferences,
      'flight_day',
      currentBedtime,
      currentWakeTime
    )
  );

  // After arrival, target destination times (habitual schedule in destination timezone)
  currentBedtime = circadianProfile.habitualBedtime;
  currentWakeTime = circadianProfile.habitualWakeTime;

  // Destination days
  const totalDestinationDays = Math.max(estimatedDaysToAdjust + 2, trip.tripDurationDays);

  for (let i = 1; i <= totalDestinationDays; i++) {
    const date = new Date(trip.arrivalDateTime);
    date.setDate(date.getDate() + i - 1);

    const detailedPhase = getDetailedPhase(i, preDepartureDays, estimatedDaysToAdjust);

    // Calculate daily shift at destination
    const remainingGap = Math.abs(calculatePhaseGap(currentDLMO, targetDLMO));
    const dailyShift = shiftDirection === 'advance'
      ? -Math.min(dailyShiftRate, remainingGap)
      : Math.min(dailyShiftRate, remainingGap);

    if (remainingGap > 0.5) {
      currentDLMO = shiftDLMO(currentDLMO, dailyShift);
      currentCBTmin = shiftDLMO(currentCBTmin, dailyShift);
    }

    days.push(
      generateProtocolDay(
        i,
        date,
        currentDLMO,
        currentCBTmin,
        targetDLMO,
        config,
        trip,
        circadianProfile,
        preferences,
        detailedPhase,
        currentBedtime,
        currentWakeTime
      )
    );
  }

  return {
    id: generateId(),
    tripId: trip.id,
    generatedAt: new Date(),
    targetBedtime: config.targetBedtime,
    targetWakeTime: config.targetWakeTime,
    estimatedDaysToAdjust,
    adjustmentRatePerDay: dailyShiftRate,
    direction: trip.direction,
    days,
    chronotypeUsed: circadianProfile.chronotypeCategory,
    interventionsEnabled,
    version: '4.0',
  };
}
