/**
 * Questionnaire Types
 *
 * Data structures for MEQ and MCTQ questionnaires.
 * These determine the user's chronotype and circadian markers.
 */

/**
 * MEQ (Morningness-Eveningness Questionnaire) Question
 * 19 questions total, each with 4-5 answer options
 */
export interface MEQQuestion {
  id: number;
  text: string;
  options: MEQOption[];
}

export interface MEQOption {
  value: number;
  label: string;
}

/**
 * MEQ Response for a single question
 */
export interface MEQResponse {
  questionId: number;
  selectedValue: number;
  answeredAt: Date;
}

/**
 * Complete MEQ questionnaire result
 */
export interface MEQResult {
  responses: MEQResponse[];
  totalScore: number; // 16-86
  completedAt: Date;
}

/**
 * MCTQ (Munich Chronotype Questionnaire) time-based questions
 */
export interface MCTQWorkdayData {
  bedtime: string;          // HH:MM - when you go to bed
  sleepPrepDuration: number; // minutes - time to get ready for sleep
  sleepLatency: number;     // minutes - time to fall asleep
  wakeTime: string;         // HH:MM - when you wake up
  usesAlarm: boolean;
  sleepInertia: number;     // minutes - time to feel fully awake
}

export interface MCTQFreedayData {
  bedtime: string;
  sleepPrepDuration: number;
  sleepLatency: number;
  wakeTime: string;
  usesAlarm: boolean;
  sleepInertia: number;
}

/**
 * Complete MCTQ result with calculated values
 */
export interface MCTQResult {
  workdayData: MCTQWorkdayData;
  freedayData: MCTQFreedayData;

  // Calculated values
  sleepDurationWorkday: number;   // minutes
  sleepDurationFreeday: number;   // minutes
  sleepOnsetWorkday: string;      // HH:MM
  sleepOnsetFreeday: string;      // HH:MM
  midSleepWorkday: string;        // MSW - HH:MM
  midSleepFreeday: string;        // MSF - HH:MM
  midSleepFreedayCorrected: string; // MSFsc - corrected for sleep debt

  // Social jet lag
  socialJetLagHours: number;      // Difference between work and free day patterns

  completedAt: Date;
}

/**
 * Questionnaire session tracking
 */
export interface QuestionnaireSession {
  id: string;
  userId: string;
  type: 'MEQ' | 'MCTQ';
  startedAt: Date;
  completedAt: Date | null;
  currentQuestionIndex: number;
  responses: MEQResponse[];
  status: 'in_progress' | 'completed' | 'abandoned';
}

/**
 * MEQ Questions Bank
 * Based on Horne & Ostberg (1976) Morningness-Eveningness Questionnaire
 */
export const MEQ_QUESTIONS: MEQQuestion[] = [
  {
    id: 1,
    text: 'Considering only your own "feeling best" rhythm, at what time would you get up if you were entirely free to plan your day?',
    options: [
      { value: 5, label: '5:00-6:30 AM' },
      { value: 4, label: '6:30-7:45 AM' },
      { value: 3, label: '7:45-9:45 AM' },
      { value: 2, label: '9:45-11:00 AM' },
      { value: 1, label: '11:00 AM-12:00 PM' },
    ],
  },
  {
    id: 2,
    text: 'Considering only your own "feeling best" rhythm, at what time would you go to bed if you were entirely free to plan your evening?',
    options: [
      { value: 5, label: '8:00-9:00 PM' },
      { value: 4, label: '9:00-10:15 PM' },
      { value: 3, label: '10:15 PM-12:30 AM' },
      { value: 2, label: '12:30-1:45 AM' },
      { value: 1, label: '1:45-3:00 AM' },
    ],
  },
  {
    id: 3,
    text: 'If there is a specific time at which you have to get up in the morning, to what extent are you dependent on being woken up by an alarm clock?',
    options: [
      { value: 4, label: 'Not at all dependent' },
      { value: 3, label: 'Slightly dependent' },
      { value: 2, label: 'Fairly dependent' },
      { value: 1, label: 'Very dependent' },
    ],
  },
  {
    id: 4,
    text: 'Assuming adequate environmental conditions, how easy do you find getting up in the mornings?',
    options: [
      { value: 1, label: 'Not at all easy' },
      { value: 2, label: 'Not very easy' },
      { value: 3, label: 'Fairly easy' },
      { value: 4, label: 'Very easy' },
    ],
  },
  {
    id: 5,
    text: 'How alert do you feel during the first half hour after having woken in the morning?',
    options: [
      { value: 1, label: 'Not at all alert' },
      { value: 2, label: 'Slightly alert' },
      { value: 3, label: 'Fairly alert' },
      { value: 4, label: 'Very alert' },
    ],
  },
  {
    id: 6,
    text: 'How is your appetite during the first half hour after having woken in the morning?',
    options: [
      { value: 1, label: 'Very poor' },
      { value: 2, label: 'Fairly poor' },
      { value: 3, label: 'Fairly good' },
      { value: 4, label: 'Very good' },
    ],
  },
  {
    id: 7,
    text: 'During the first half hour after having woken in the morning, how tired do you feel?',
    options: [
      { value: 1, label: 'Very tired' },
      { value: 2, label: 'Fairly tired' },
      { value: 3, label: 'Fairly refreshed' },
      { value: 4, label: 'Very refreshed' },
    ],
  },
  {
    id: 8,
    text: 'When you have no commitments the next day, at what time do you go to bed compared to your usual bedtime?',
    options: [
      { value: 4, label: 'Seldom or never later' },
      { value: 3, label: 'Less than one hour later' },
      { value: 2, label: '1-2 hours later' },
      { value: 1, label: 'More than 2 hours later' },
    ],
  },
  {
    id: 9,
    text: 'You have decided to engage in some physical exercise. A friend suggests that you do this one hour twice a week and the best time for them is between 7:00-8:00 AM. How do you think you would perform?',
    options: [
      { value: 4, label: 'Would be in good form' },
      { value: 3, label: 'Would be in reasonable form' },
      { value: 2, label: 'Would find it difficult' },
      { value: 1, label: 'Would find it very difficult' },
    ],
  },
  {
    id: 10,
    text: 'At what time in the evening do you feel tired and as a result in need of sleep?',
    options: [
      { value: 5, label: '8:00-9:00 PM' },
      { value: 4, label: '9:00-10:15 PM' },
      { value: 3, label: '10:15 PM-12:30 AM' },
      { value: 2, label: '12:30-1:45 AM' },
      { value: 1, label: '1:45-3:00 AM' },
    ],
  },
  {
    id: 11,
    text: 'You wish to be at your peak performance for a test which you know is going to be mentally exhausting and lasting for two hours. You are entirely free to plan your day. Which ONE of the four testing times would you choose?',
    options: [
      { value: 6, label: '8:00-10:00 AM' },
      { value: 4, label: '11:00 AM-1:00 PM' },
      { value: 2, label: '3:00-5:00 PM' },
      { value: 0, label: '7:00-9:00 PM' },
    ],
  },
  {
    id: 12,
    text: 'If you went to bed at 11:00 PM, at what level of tiredness would you be?',
    options: [
      { value: 0, label: 'Not at all tired' },
      { value: 2, label: 'A little tired' },
      { value: 3, label: 'Fairly tired' },
      { value: 5, label: 'Very tired' },
    ],
  },
  {
    id: 13,
    text: 'For some reason you have gone to bed several hours later than usual, but there is no need to get up at any particular time the next morning. Which ONE of the following events are you most likely to experience?',
    options: [
      { value: 4, label: 'Will wake up at usual time and will NOT fall asleep' },
      { value: 3, label: 'Will wake up at usual time and will doze thereafter' },
      { value: 2, label: 'Will wake up at usual time but will fall asleep again' },
      { value: 1, label: 'Will NOT wake up until later than usual' },
    ],
  },
  {
    id: 14,
    text: 'One night you have to remain awake between 4:00-6:00 AM in order to carry out a night watch. You have no commitments the next day. Which ONE of the following alternatives will suit you best?',
    options: [
      { value: 1, label: 'Would NOT go to bed until watch was over' },
      { value: 2, label: 'Would take a nap before and sleep after' },
      { value: 3, label: 'Would take a good sleep before and nap after' },
      { value: 4, label: 'Would take ALL sleep before watch' },
    ],
  },
  {
    id: 15,
    text: 'You have to do two hours of hard physical work. You are entirely free to plan your day. Which ONE of the following times would you choose?',
    options: [
      { value: 4, label: '8:00-10:00 AM' },
      { value: 3, label: '11:00 AM-1:00 PM' },
      { value: 2, label: '3:00-5:00 PM' },
      { value: 1, label: '7:00-9:00 PM' },
    ],
  },
  {
    id: 16,
    text: 'You have decided to engage in hard physical exercise. A friend suggests that you do this for one hour twice a week and the best time for them is between 10:00-11:00 PM. How well do you think you would perform?',
    options: [
      { value: 1, label: 'Would be in good form' },
      { value: 2, label: 'Would be in reasonable form' },
      { value: 3, label: 'Would find it difficult' },
      { value: 4, label: 'Would find it very difficult' },
    ],
  },
  {
    id: 17,
    text: 'Suppose that you can choose your own work hours. Assume that you worked a FIVE hour day (including breaks) and that your job was interesting and paid by results. Which FIVE CONSECUTIVE HOURS would you select?',
    options: [
      { value: 5, label: '4:00-8:00 AM' },
      { value: 4, label: '8:00 AM-1:00 PM' },
      { value: 3, label: '9:00 AM-2:00 PM' },
      { value: 2, label: '2:00-7:00 PM' },
      { value: 1, label: '5:00-10:00 PM' },
    ],
  },
  {
    id: 18,
    text: 'At what time of day do you think that you reach your "feeling best" peak?',
    options: [
      { value: 5, label: '5:00-8:00 AM' },
      { value: 4, label: '8:00-10:00 AM' },
      { value: 3, label: '10:00 AM-5:00 PM' },
      { value: 2, label: '5:00-9:00 PM' },
      { value: 1, label: '9:00 PM-5:00 AM' },
    ],
  },
  {
    id: 19,
    text: 'One hears about "morning" and "evening" types of people. Which ONE of these types do you consider yourself to be?',
    options: [
      { value: 6, label: 'Definitely a "morning" type' },
      { value: 4, label: 'Rather more a "morning" than an "evening" type' },
      { value: 2, label: 'Rather more an "evening" than a "morning" type' },
      { value: 0, label: 'Definitely an "evening" type' },
    ],
  },
];

/**
 * Calculate MEQ total score from responses
 */
export function calculateMEQScore(responses: MEQResponse[]): number {
  return responses.reduce((sum, r) => sum + r.selectedValue, 0);
}

/**
 * Get chronotype category from MEQ score
 */
export function getMEQChronotypeCategory(
  score: number
): import('./user').ChronotypeCategory {
  if (score >= 70) return 'definite_morning';
  if (score >= 59) return 'moderate_morning';
  if (score >= 42) return 'intermediate';
  if (score >= 31) return 'moderate_evening';
  return 'definite_evening';
}

/**
 * Parse HH:MM time string to decimal hours
 */
export function parseTimeToDecimal(time: string): number {
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
 * Calculate MCTQ mid-sleep time
 * MSF = Sleep Onset + (Sleep Duration / 2)
 */
export function calculateMidSleep(sleepOnset: string, sleepDuration: number): string {
  const onsetDecimal = parseTimeToDecimal(sleepOnset);
  const durationHours = sleepDuration / 60;
  const midSleep = onsetDecimal + durationHours / 2;
  return decimalToTime(midSleep);
}

/**
 * Calculate corrected mid-sleep on free days (MSFsc)
 * This corrects for sleep debt accumulated during workdays
 */
export function calculateMSFsc(
  midSleepFreeday: string,
  sleepDurationFreeday: number,
  sleepDurationWorkday: number
): string {
  const msfDecimal = parseTimeToDecimal(midSleepFreeday);
  const sdFree = sleepDurationFreeday / 60;
  const sdWork = sleepDurationWorkday / 60;

  // Average sleep duration
  const avgSleep = (sdWork * 5 + sdFree * 2) / 7;

  // If free day sleep exceeds average, correct for oversleep
  if (sdFree > avgSleep) {
    const correction = (sdFree - avgSleep) / 2;
    return decimalToTime(msfDecimal - correction);
  }

  return midSleepFreeday;
}

/**
 * Calculate social jet lag (difference between work and free day patterns)
 */
export function calculateSocialJetLag(
  midSleepWorkday: string,
  midSleepFreeday: string
): number {
  const mswDecimal = parseTimeToDecimal(midSleepWorkday);
  const msfDecimal = parseTimeToDecimal(midSleepFreeday);

  // Handle overnight differences
  let diff = msfDecimal - mswDecimal;
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;

  return Math.abs(diff);
}
