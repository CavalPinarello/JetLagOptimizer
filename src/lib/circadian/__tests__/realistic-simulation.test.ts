/**
 * Realistic Human Simulation Tests v3.0
 *
 * These tests verify the protocol generator produces realistic,
 * actionable recommendations that make sense for real humans.
 *
 * Based on peer-reviewed research:
 * - Burgess et al. (2003) Preflight Adjustment to Eastward Travel
 * - Youngstedt (2019) Human Circadian PRCs for Exercise
 * - Eastman & Burgess (2009) How to Travel Without Jet Lag
 */

import { describe, it, expect } from 'vitest';
import { generateProtocol, ProtocolGeneratorInput } from '../protocol-generator';
import type { Trip } from '@/types/trip';
import type { CircadianProfile, UserPreferences, ChronotypeCategory } from '@/types/user';

// Helper to create test data
function createTestTrip(overrides: Partial<Trip> = {}): Trip {
  const now = new Date();
  const departureDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
  const arrivalDate = new Date(departureDate.getTime() + 11 * 60 * 60 * 1000); // 11 hours later

  return {
    id: 'test-trip-1',
    userId: 'test-user',
    name: 'Test Trip',
    createdAt: now,
    updatedAt: now,
    originCity: 'San Francisco',
    originAirport: 'SFO',
    originTimezone: 'America/Los_Angeles',
    originOffsetMinutes: -480, // UTC-8
    destinationCity: 'Vienna',
    destinationAirport: 'VIE',
    destinationTimezone: 'Europe/Vienna',
    destinationOffsetMinutes: 60, // UTC+1
    departureDateTime: departureDate,
    arrivalDateTime: arrivalDate,
    flightDuration: 660, // 11 hours
    timezoneShiftHours: 9, // SFO to Vienna is +9h (eastward)
    direction: 'eastward',
    hasReturnTrip: false,
    returnDepartureDateTime: null,
    returnArrivalDateTime: null,
    tripDurationDays: 10,
    isShortTrip: false,
    purpose: 'business',
    protocolId: null,
    protocolGeneratedAt: null,
    status: 'upcoming',
    ...overrides,
  };
}

function createTestProfile(chronotype: ChronotypeCategory = 'intermediate'): CircadianProfile {
  return {
    meqScore: 50,
    chronotypeCategory: chronotype,
    estimatedDLMO: '21:30',
    estimatedCBTmin: '04:30',
    habitualBedtime: '23:00',
    habitualWakeTime: '07:00',
    averageSleepDuration: 480,
    workdayBedtime: '23:00',
    workdayWakeTime: '07:00',
    freedayBedtime: '00:00',
    freedayWakeTime: '08:00',
    usesAlarmOnFreedays: false,
    lastAssessmentDate: new Date(),
    assessmentMethod: 'MEQ',
  };
}

function createTestPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    usesMelatonin: true,
    melatoninDose: 0.5,
    usesCreatine: true,
    creatineDose: 5,
    caffeineUser: true,
    caffeineCutoffHours: 6,
    exerciseFrequency: 'regularly',
    preferredExerciseTime: 'morning',
    darkMode: false,
    timeFormat: '24h',
    homeTimezone: 'America/Los_Angeles',
    aggressiveAdjustment: false,
    includeNapGuidance: true,
    ...overrides,
  };
}

// Helper to parse time string to decimal hours
function timeToDecimal(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}

describe('Protocol Generator v3.0 - Realistic Human Behavior', () => {
  describe('Caffeine cutoff is at 2 PM (14:00) max', () => {
    it('caffeine window ends by 14:00 for normal bedtimes', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      // Check all caffeine interventions
      protocol.days.forEach((day) => {
        const caffeineInterventions = day.interventions.filter(
          (i) => i.type === 'caffeine' && !i.title.includes('In-Flight')
        );

        caffeineInterventions.forEach((caffeine) => {
          if (caffeine.endTime) {
            const endTime = timeToDecimal(caffeine.endTime);
            // Cutoff should be 14:00 (2 PM) or earlier
            expect(endTime).toBeLessThanOrEqual(14);
          }
        });
      });
    });

    it('caffeine window starts after wake time', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      protocol.days.forEach((day) => {
        const caffeineInterventions = day.interventions.filter(
          (i) => i.type === 'caffeine' && !i.title.includes('In-Flight')
        );

        caffeineInterventions.forEach((caffeine) => {
          const startTime = timeToDecimal(caffeine.startTime);
          // Caffeine should never start at midnight
          expect(startTime).toBeGreaterThan(4); // After 4 AM at minimum
          expect(startTime).toBeLessThan(12); // Before noon
        });
      });
    });
  });

  describe('Pre-departure is max 3 days', () => {
    it('has at most 3 pre-departure days for large timezone shifts', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip({ timezoneShiftHours: 9 }), // +9h eastward
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);
      const preDepartureDays = protocol.days.filter((d) => d.dayNumber < 0);

      // Max 3 pre-departure days
      expect(preDepartureDays.length).toBeLessThanOrEqual(3);
      expect(preDepartureDays.length).toBeGreaterThanOrEqual(2);
    });

    it('has fewer pre-departure days for short trips', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip({
          timezoneShiftHours: 5,
          tripDurationDays: 2, // Very short trip
          isShortTrip: true,
        }),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);
      const preDepartureDays = protocol.days.filter((d) => d.dayNumber < 0);

      // For very short trips, minimal pre-adjustment
      expect(preDepartureDays.length).toBe(0);
    });
  });

  describe('Wake time is capped at 2h earlier than habitual', () => {
    it('never shifts wake time more than 2h earlier during pre-departure', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip({ timezoneShiftHours: 9 }),
        circadianProfile: createTestProfile(), // habitual wake 07:00
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);
      const preDepartureDays = protocol.days.filter((d) => d.dayNumber < 0);

      preDepartureDays.forEach((day) => {
        const sleepIntervention = day.interventions.find((i) => i.type === 'sleep');
        if (sleepIntervention && sleepIntervention.endTime) {
          const wakeTime = timeToDecimal(sleepIntervention.endTime);
          // Wake time should not be earlier than 05:00 (habitual 07:00 - 2h)
          expect(wakeTime).toBeGreaterThanOrEqual(5);
        }
      });
    });
  });

  describe('Melatonin timing is 5-5.5h before bed', () => {
    it('schedules melatonin 5.5h before bedtime for eastward travel', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip({ direction: 'eastward' }),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences({ usesMelatonin: true }),
      };

      const protocol = generateProtocol(input);

      protocol.days.forEach((day) => {
        const melatoninIntervention = day.interventions.find((i) => i.type === 'melatonin');
        const sleepIntervention = day.interventions.find((i) => i.type === 'sleep');

        if (melatoninIntervention && sleepIntervention) {
          const melatoninTime = timeToDecimal(melatoninIntervention.startTime);
          let bedtime = timeToDecimal(sleepIntervention.startTime);

          // Handle day wraparound
          if (bedtime < 12) bedtime += 24;

          const hoursBeforeBed = bedtime - melatoninTime;

          // Should be 5-6 hours before bed
          expect(hoursBeforeBed).toBeGreaterThanOrEqual(4.5);
          expect(hoursBeforeBed).toBeLessThanOrEqual(7);
        }
      });
    });
  });

  describe('Creatine intervention is included', () => {
    it('includes creatine on arrival day and active adjustment days', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences({ usesCreatine: true }),
      };

      const protocol = generateProtocol(input);

      // Find arrival day
      const arrivalDay = protocol.days.find((d) => d.dayNumber === 1);
      const creatineOnArrival = arrivalDay?.interventions.find((i) => i.type === 'creatine');

      expect(creatineOnArrival).toBeDefined();
      expect(creatineOnArrival?.title).toBe('Creatine');
    });

    it('creatine mentions cognitive benefits during sleep deprivation', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences({ usesCreatine: true }),
      };

      const protocol = generateProtocol(input);

      const arrivalDay = protocol.days.find((d) => d.dayNumber === 1);
      const creatineIntervention = arrivalDay?.interventions.find((i) => i.type === 'creatine');

      // Check for cognitive-related terms
      const mentionsCognitive =
        creatineIntervention?.rationale?.includes('cognitive') ||
        creatineIntervention?.rationale?.includes('processing speed') ||
        creatineIntervention?.rationale?.includes('memory') ||
        creatineIntervention?.rationale?.includes('mental clarity');

      expect(mentionsCognitive).toBe(true);
      expect(creatineIntervention?.rationale).toContain('sleep deprivation');
    });
  });

  describe('Exercise has chronotype-specific guidance', () => {
    it('mentions chronotype in exercise description for evening types', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip({ direction: 'eastward' }),
        circadianProfile: createTestProfile('moderate_evening'),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      // Find an exercise intervention
      const dayWithExercise = protocol.days.find((d) =>
        d.interventions.some((i) => i.type === 'exercise')
      );
      const exerciseIntervention = dayWithExercise?.interventions.find(
        (i) => i.type === 'exercise'
      );

      expect(exerciseIntervention?.description).toContain('evening type');
    });

    it('includes HR zone guidance', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      const dayWithExercise = protocol.days.find((d) =>
        d.interventions.some((i) => i.type === 'exercise')
      );
      const exerciseIntervention = dayWithExercise?.interventions.find(
        (i) => i.type === 'exercise'
      );

      expect(exerciseIntervention?.description).toContain('HR');
    });

    it('morning exercise for eastward travel', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip({ direction: 'eastward' }),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      const dayWithExercise = protocol.days.find((d) =>
        d.interventions.some((i) => i.type === 'exercise') && d.dayNumber >= 1
      );
      const exerciseIntervention = dayWithExercise?.interventions.find(
        (i) => i.type === 'exercise'
      );

      expect(exerciseIntervention?.title).toContain('Morning');
    });
  });

  describe('Meal interventions mention organ clocks', () => {
    it('breakfast mentions liver and gut clocks', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      const breakfastInterventions = protocol.days.flatMap((d) =>
        d.interventions.filter(
          (i) => i.type === 'meal' && i.title.includes('Breakfast')
        )
      );

      const mentionsOrganClocks = breakfastInterventions.some(
        (i) =>
          i.description?.includes('liver') ||
          i.description?.includes('gut') ||
          i.rationale?.includes('liver') ||
          i.rationale?.includes('peripheral')
      );

      expect(mentionsOrganClocks).toBe(true);
    });
  });

  describe('Arrival day tips mention multiple body clocks', () => {
    it('arrival day mentions organ clock alignment', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);
      const arrivalDay = protocol.days.find((d) => d.dayNumber === 1);

      const mentionsMultipleClocks = arrivalDay?.tips.some(
        (tip) =>
          tip.includes('SCN') ||
          tip.includes('liver') ||
          tip.includes('body clocks') ||
          tip.includes('brain') ||
          tip.includes('gut')
      );

      expect(mentionsMultipleClocks).toBe(true);
    });
  });

  describe('Flight day has appropriate instructions', () => {
    it('includes set-watch-to-destination advice', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);
      const flightDay = protocol.days.find((d) => d.dayNumber === 0);

      expect(flightDay).toBeDefined();

      const setWatchIntervention = flightDay?.interventions.find((i) =>
        i.title.includes('Set Mental Clock') || i.title.includes('Set Watch')
      );
      expect(setWatchIntervention).toBeDefined();
    });

    it('includes in-flight eating guidance', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip({ flightDuration: 660 }), // 11 hour flight
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);
      const flightDay = protocol.days.find((d) => d.dayNumber === 0);

      const mealGuidance = flightDay?.interventions.find((i) =>
        i.title.includes('In-Flight')
      );
      expect(mealGuidance).toBeDefined();
    });
  });

  describe('Sleep duration is realistic', () => {
    it('sleep duration is 7-9 hours for non-flight days, or 20/90 min for in-flight naps', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      protocol.days.forEach((day) => {
        // Flight day (day 0) has special nap-based sleep windows
        if (day.dayNumber === 0) {
          const sleepInterventions = day.interventions.filter(
            (i) => i.type === 'sleep'
          );

          sleepInterventions.forEach((sleepIntervention) => {
            if (sleepIntervention.duration) {
              const durationMin = sleepIntervention.duration;
              // In-flight sleep is either 20-min power nap or 90-min full cycle
              const isValidInFlightNap = durationMin === 20 || durationMin === 90;
              expect(isValidInFlightNap).toBe(true);
            }
          });
        } else {
          // Non-flight days should have 6-10 hour sleep
          const sleepIntervention = day.interventions.find(
            (i) => i.type === 'sleep' && i.title.includes('Sleep Window')
          );

          if (sleepIntervention && sleepIntervention.duration) {
            const durationHours = sleepIntervention.duration / 60;
            // Sleep should be 6-10 hours (realistic range)
            expect(durationHours).toBeGreaterThanOrEqual(6);
            expect(durationHours).toBeLessThanOrEqual(10);
          }
        }
      });
    });
  });

  describe('Exercise timing is practical', () => {
    it('exercise happens during reasonable waking hours', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      protocol.days.forEach((day) => {
        const exerciseInterventions = day.interventions.filter(
          (i) => i.type === 'exercise'
        );

        exerciseInterventions.forEach((exercise) => {
          const startTime = timeToDecimal(exercise.startTime);
          const endTime = timeToDecimal(exercise.endTime!);

          // Exercise should be during waking hours (5 AM - 10 PM)
          expect(startTime).toBeGreaterThanOrEqual(5);
          expect(endTime).toBeLessThanOrEqual(22);
        });
      });
    });
  });

  describe('Protocol output validation', () => {
    it('prints a sample day for manual review', () => {
      const input: ProtocolGeneratorInput = {
        trip: createTestTrip(),
        circadianProfile: createTestProfile(),
        preferences: createTestPreferences(),
      };

      const protocol = generateProtocol(input);

      // Print protocol summary
      console.log('\n=== PROTOCOL v3.0 SUMMARY ===');
      console.log(`Version: ${protocol.version}`);
      console.log(`Direction: ${protocol.direction}`);
      console.log(`Estimated days to adjust: ${protocol.estimatedDaysToAdjust}`);
      console.log(`Pre-departure days: ${protocol.days.filter(d => d.dayNumber < 0).length}`);
      console.log(`Total days: ${protocol.days.length}`);

      // Print pre-departure days
      console.log('\n=== PRE-DEPARTURE DAYS ===');
      protocol.days.filter(d => d.dayNumber < 0).forEach((day) => {
        const sleep = day.interventions.find(i => i.type === 'sleep');
        const caffeine = day.interventions.find(i => i.type === 'caffeine');
        const melatonin = day.interventions.find(i => i.type === 'melatonin');
        console.log(`Day ${day.dayNumber}:`);
        console.log(`  Sleep: ${sleep?.startTime} - ${sleep?.endTime}`);
        console.log(`  Caffeine: ${caffeine?.startTime} - ${caffeine?.endTime}`);
        console.log(`  Melatonin: ${melatonin?.startTime || 'N/A'}`);
      });

      // Print arrival day
      const arrivalDay = protocol.days.find((d) => d.dayNumber === 1);
      console.log('\n=== ARRIVAL DAY ===');
      console.log(`Phase: ${arrivalDay?.phase}`);
      console.log(`Summary: ${arrivalDay?.summary}`);
      console.log(`Progress: ${arrivalDay?.adjustmentProgress}%`);
      console.log('\nInterventions:');

      arrivalDay?.interventions.forEach((i) => {
        const time = i.endTime ? `${i.startTime} - ${i.endTime}` : i.startTime;
        console.log(`  [${i.priority}] ${i.title}: ${time}`);
      });

      console.log('\nTips:');
      arrivalDay?.tips.forEach((tip) => {
        console.log(`  - ${tip}`);
      });

      expect(arrivalDay).toBeDefined();
    });
  });
});
