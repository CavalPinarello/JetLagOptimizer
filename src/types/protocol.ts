/**
 * Protocol Types
 *
 * Core data structures for circadian adjustment protocols.
 * This is the heart of the application - defining interventions and daily schedules.
 * Types are framework-agnostic for Swift portability.
 */

import type { ChronotypeCategory } from './user';
import type { TripDirection } from './trip';

// Types of interventions the app can recommend
export type InterventionType =
  | 'light_exposure'      // Seek bright light
  | 'light_avoidance'     // Avoid/block light
  | 'sleep'               // Sleep window
  | 'melatonin'           // Melatonin supplementation
  | 'caffeine'            // Caffeine guidance
  | 'meal'                // Meal timing
  | 'exercise'            // Physical activity
  | 'creatine';           // Creatine supplementation

// Phase of the adjustment process
export type ProtocolPhase =
  | 'pre_departure'       // 1-3 days before travel
  | 'in_flight'           // During the flight
  | 'destination'         // At destination, still adjusting
  | 'adjusted';           // Fully adjusted to new timezone

// Priority level for interventions
export type InterventionPriority =
  | 'critical'            // Must do for effective adjustment
  | 'recommended'         // Strongly suggested
  | 'optional';           // Helpful but not essential

/**
 * Light intervention details
 */
export interface LightInterventionDetails {
  type: 'light_exposure' | 'light_avoidance';
  intensity: 'bright' | 'moderate' | 'dim' | 'dark' | 'any';
  source: 'outdoor' | 'lightbox' | 'blue_light_glasses' | 'sunglasses' | 'eye_mask' | 'cabin_lights' | 'any';
  luxTarget: number;                 // Target light level in lux
  blueBlockersRecommended: boolean;  // For avoidance
  outdoorPreferred: boolean;         // Outdoor sunlight is most effective
}

/**
 * Sleep intervention details
 */
export interface SleepInterventionDetails {
  type: 'sleep';
  targetBedtime: string;             // HH:MM
  targetWakeTime: string;            // HH:MM
  sleepDuration: number;             // minutes
  napAllowed: boolean;
  napWindow?: {
    start: string;                   // HH:MM
    end: string;                     // HH:MM
    maxDuration: number;             // minutes
  };
}

/**
 * Melatonin intervention details
 */
export interface MelatoninInterventionDetails {
  type: 'melatonin';
  dose: number;                      // mg
  timing: string;                    // e.g., "4-6 hours before target bedtime"
  formulation?: 'immediate' | 'extended';
}

/**
 * Caffeine intervention details
 */
export interface CaffeineInterventionDetails {
  type: 'caffeine';
  allowed: boolean;
  cutoffTime: string;                // HH:MM - no caffeine after this
  maxIntakeBeforeCutoff: string;     // e.g., "200mg" or "2 cups coffee"
  recommendedTimes?: string[];       // Optimal times to consume
}

/**
 * Meal intervention details
 */
export interface MealInterventionDetails {
  type: 'meal';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'fast' | 'meal' | 'any';
  anchorMeal: boolean;               // Is this a timing anchor for peripheral clocks?
  composition?: 'light' | 'normal' | 'heavy' | 'balanced' | 'protein-rich';
  fastingPeriod?: {
    start: string;                   // HH:MM
    end: string;                     // HH:MM
  };
  notes?: string;
}

/**
 * Exercise intervention details
 */
export interface ExerciseInterventionDetails {
  type: 'exercise';
  intensity: 'light' | 'moderate' | 'vigorous';
  preferredTiming: 'morning' | 'afternoon' | 'evening';
  duration: number;                  // minutes
  outdoorPreferred: boolean;         // Combines exercise + light
  examples?: string[];               // e.g., ["30 min walk", "gym workout"]
}

/**
 * Creatine intervention details
 */
export interface CreatineInterventionDetails {
  type: 'creatine';
  dose: number;                      // grams
  timing: string;                    // When to take
  withMeal: boolean;
}

// Union type for all intervention details
export type InterventionDetails =
  | LightInterventionDetails
  | SleepInterventionDetails
  | MelatoninInterventionDetails
  | CaffeineInterventionDetails
  | MealInterventionDetails
  | ExerciseInterventionDetails
  | CreatineInterventionDetails;

/**
 * A single intervention in the protocol
 */
export interface Intervention {
  id: string;
  type: InterventionType;

  // Timing
  startTime: string;                 // HH:MM (local time)
  endTime: string | null;            // HH:MM or null for point-in-time
  duration: number | null;           // minutes, if applicable

  // Content
  title: string;                     // Short title for display
  description: string;               // What to do
  rationale: string;                 // Scientific explanation (for tooltips)

  // Type-specific details
  details: InterventionDetails;

  // Importance
  priority: InterventionPriority;

  // Tracking
  completed: boolean;
  completedAt?: Date;
  skipped: boolean;
  skipReason?: string;
  notes?: string;
}

/**
 * A single day in the protocol
 */
export interface ProtocolDay {
  dayNumber: number;                 // -3, -2, -1, 0 (travel), 1, 2, ...
  date: Date;
  phase: ProtocolPhase;
  timezone: string;                  // Which timezone times are displayed in

  // Current circadian state estimates
  estimatedDLMO: string;             // HH:MM - current estimated DLMO
  estimatedCBTmin: string;           // HH:MM - current estimated CBT minimum
  phaseShiftFromHome: number;        // hours shifted from home time (can be partial)
  adjustmentProgress: number;        // 0-100%

  // All interventions for this day
  interventions: Intervention[];

  // Summary for quick display
  summary: string;                   // e.g., "Day 2: Focus on morning light"
  tips: string[];                    // Additional tips for the day
}

/**
 * Complete protocol for a trip
 */
export interface Protocol {
  id: string;
  tripId: string;
  generatedAt: Date;

  // Target schedule at destination
  targetBedtime: string;             // HH:MM
  targetWakeTime: string;            // HH:MM

  // Adjustment estimates
  estimatedDaysToAdjust: number;
  adjustmentRatePerDay: number;      // hours per day

  // Direction of adjustment
  direction: TripDirection;

  // All days in the protocol
  days: ProtocolDay[];

  // Metadata about generation
  chronotypeUsed: ChronotypeCategory;
  interventionsEnabled: InterventionType[];

  // Protocol version (for future updates)
  version: string;
}

/**
 * Circadian state at any point in time
 * Used for visualization and calculations
 */
export interface CircadianState {
  timestamp: Date;

  // Estimated markers
  dlmo: Date;                        // Dim Light Melatonin Onset
  cbtMin: Date;                      // Core Body Temperature minimum

  // Phase relative to target
  phaseAngle: number;                // Hours from target (negative = behind)

  // Central vs peripheral desynchrony
  scnPhase: number;                  // Central clock phase (hours from aligned)
  peripheralPhase: number;           // Peripheral clock phase
  desynchronyLevel: 'none' | 'mild' | 'moderate' | 'severe';
}

/**
 * Optimal zeitgeber timing windows based on current phase
 */
export interface ZeitgeberTiming {
  // Light
  lightSeekWindow: { start: string; end: string };
  lightAvoidWindow: { start: string; end: string };

  // Melatonin
  melatoninWindow: { start: string; end: string };

  // Exercise
  exerciseWindow: { start: string; end: string };

  // Meals
  breakfastAnchor: string;           // HH:MM
  dinnerCutoff: string;              // HH:MM - no heavy meals after

  // Caffeine
  caffeineCutoff: string;            // HH:MM
}

/**
 * Get icon name for intervention type (for UI)
 */
export function getInterventionIcon(type: InterventionType): string {
  const icons: Record<InterventionType, string> = {
    light_exposure: 'sun',
    light_avoidance: 'moon',
    sleep: 'bed-double',
    melatonin: 'pill',
    caffeine: 'coffee',
    meal: 'utensils',
    exercise: 'dumbbell',
    creatine: 'flask-conical',
  };
  return icons[type];
}

/**
 * Get color for intervention type (for UI)
 */
export function getInterventionColor(type: InterventionType): string {
  const colors: Record<InterventionType, string> = {
    light_exposure: 'amber',
    light_avoidance: 'slate',
    sleep: 'indigo',
    melatonin: 'purple',
    caffeine: 'orange',
    meal: 'green',
    exercise: 'blue',
    creatine: 'cyan',
  };
  return colors[type];
}

/**
 * Get human-readable label for intervention type
 */
export function getInterventionLabel(type: InterventionType): string {
  const labels: Record<InterventionType, string> = {
    light_exposure: 'Light Exposure',
    light_avoidance: 'Light Avoidance',
    sleep: 'Sleep',
    melatonin: 'Melatonin',
    caffeine: 'Caffeine',
    meal: 'Meal Timing',
    exercise: 'Exercise',
    creatine: 'Creatine',
  };
  return labels[type];
}
