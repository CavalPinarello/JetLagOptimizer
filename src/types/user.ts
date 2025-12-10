/**
 * User and Profile Types
 *
 * Core user data structures including circadian profile and preferences.
 * These types are designed to be framework-agnostic for future Swift portability.
 */

// Chronotype categories based on MEQ (Morningness-Eveningness Questionnaire) scores
export type ChronotypeCategory =
  | 'definite_morning'    // MEQ 70-86: Strong morning preference
  | 'moderate_morning'    // MEQ 59-69: Moderate morning preference
  | 'intermediate'        // MEQ 42-58: No strong preference
  | 'moderate_evening'    // MEQ 31-41: Moderate evening preference
  | 'definite_evening';   // MEQ 16-30: Strong evening preference

// Assessment method used to determine chronotype
export type AssessmentMethod = 'MEQ' | 'MCTQ' | 'BOTH';

/**
 * User's circadian profile derived from questionnaire responses.
 * Contains all timing markers and sleep patterns needed for protocol generation.
 */
export interface CircadianProfile {
  // Questionnaire results
  meqScore: number | null;           // 16-86 scale (MEQ)
  mctqMSFsc: number | null;          // Corrected mid-sleep on free days in hours (MCTQ)
  chronotypeCategory: ChronotypeCategory;

  // Estimated timing markers (HH:MM format, local time)
  // DLMO = Dim Light Melatonin Onset - when natural melatonin starts rising
  estimatedDLMO: string;
  // CBTmin = Core Body Temperature minimum - lowest point of body temp cycle
  estimatedCBTmin: string;

  // Habitual sleep window
  habitualBedtime: string;           // HH:MM
  habitualWakeTime: string;          // HH:MM
  averageSleepDuration: number;      // minutes

  // Work schedule (for MCTQ calculations)
  workdayBedtime: string;
  workdayWakeTime: string;
  freedayBedtime: string;
  freedayWakeTime: string;
  usesAlarmOnFreedays: boolean;

  // Assessment metadata
  lastAssessmentDate: Date;
  assessmentMethod: AssessmentMethod;
}

/**
 * User preferences for interventions and display
 */
export interface UserPreferences {
  // Supplement preferences
  usesMelatonin: boolean;
  melatoninDose: 0.5 | 1 | 2 | 3 | 5; // mg - common dosages
  usesCreatine: boolean;
  creatineDose: number;              // grams per day

  // Caffeine habits
  caffeineUser: boolean;
  caffeineCutoffHours: number;       // hours before bed to stop caffeine

  // Exercise preferences
  exerciseFrequency: 'never' | 'occasionally' | 'regularly' | 'daily';
  preferredExerciseTime: 'morning' | 'afternoon' | 'evening' | 'flexible';

  // Display preferences
  darkMode: boolean;
  timeFormat: '12h' | '24h';
  homeTimezone: string;              // IANA timezone (e.g., 'America/New_York')

  // Protocol preferences
  aggressiveAdjustment: boolean;     // Prefer faster adjustment with more interventions
  includeNapGuidance: boolean;       // Include power nap recommendations
}

/**
 * Complete user profile combining auth info, circadian data, and preferences
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // Circadian profile (null if questionnaire not completed)
  circadianProfile: CircadianProfile | null;

  // User preferences
  preferences: UserPreferences;
}

/**
 * Default preferences for new users
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  usesMelatonin: false,
  melatoninDose: 0.5,
  usesCreatine: false,
  creatineDose: 5,
  caffeineUser: true,
  caffeineCutoffHours: 6,
  exerciseFrequency: 'occasionally',
  preferredExerciseTime: 'flexible',
  darkMode: false,
  timeFormat: '24h',
  homeTimezone: 'UTC',
  aggressiveAdjustment: false,
  includeNapGuidance: true,
};

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
 */
export function getChronotypeAdaptationFactor(
  category: ChronotypeCategory,
  direction: 'eastward' | 'westward'
): number {
  // Morning types adapt easier to eastward (advancing clock)
  // Evening types adapt easier to westward (delaying clock)
  const factors: Record<ChronotypeCategory, { eastward: number; westward: number }> = {
    definite_morning: { eastward: 0.8, westward: 1.2 },
    moderate_morning: { eastward: 0.9, westward: 1.1 },
    intermediate: { eastward: 1.0, westward: 1.0 },
    moderate_evening: { eastward: 1.1, westward: 0.9 },
    definite_evening: { eastward: 1.2, westward: 0.8 },
  };
  return factors[category][direction];
}
