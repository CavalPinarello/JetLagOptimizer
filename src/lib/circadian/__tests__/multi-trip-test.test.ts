/**
 * Multi-Trip Protocol Generation Test
 *
 * Tests all 4 travel scenarios with detailed output:
 * 1. NYC → London (Eastward +5h, 7 days)
 * 2. London → LA (Westward -8h, 10 days)
 * 3. NYC → Tokyo (Eastward +14h, 14 days)
 * 4. Sydney → Dubai (Westward -7h, 5 days)
 */

import { describe, it, expect } from 'vitest';
import { generateProtocol } from '../protocol-generator';
import type { Trip } from '@/types/trip';
import type { CircadianProfile } from '@/types/user';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';

// Test circadian profile (intermediate chronotype)
const testProfile: CircadianProfile = {
  meqScore: 55,
  mctqMSFsc: null,
  chronotypeCategory: 'intermediate',
  estimatedDLMO: '21:00',
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

// Create base trip helper
function createTrip(overrides: Partial<Trip>): Trip {
  return {
    id: 'test-trip',
    userId: 'test-user',
    name: 'Test Trip',
    createdAt: new Date(),
    updatedAt: new Date(),
    originCity: 'Origin',
    originTimezone: 'UTC',
    originAirport: 'ORG',
    originOffsetMinutes: 0,
    destinationCity: 'Destination',
    destinationTimezone: 'UTC',
    destinationAirport: 'DST',
    destinationOffsetMinutes: 0,
    departureDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    flightDuration: 480,
    timezoneShiftHours: 0,
    direction: 'eastward',
    hasReturnTrip: false,
    returnDepartureDateTime: null,
    returnArrivalDateTime: null,
    tripDurationDays: 7,
    isShortTrip: false,
    protocolId: null,
    protocolGeneratedAt: null,
    status: 'upcoming',
    ...overrides,
  };
}

describe('Multi-Trip Protocol Generation - Complete Test Suite', () => {
  describe('Scenario 1: NYC → London (Eastward +5h, 7 days)', () => {
    const trip = createTrip({
      id: 'nyc-london',
      name: 'NYC to London',
      originCity: 'New York',
      originTimezone: 'America/New_York',
      originAirport: 'JFK',
      originOffsetMinutes: -300,
      destinationCity: 'London',
      destinationTimezone: 'Europe/London',
      destinationAirport: 'LHR',
      destinationOffsetMinutes: 0,
      flightDuration: 420,
      timezoneShiftHours: 5,
      direction: 'eastward',
      tripDurationDays: 7,
    });

    it('generates valid eastward protocol', () => {
      const protocol = generateProtocol({
        trip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      // Basic structure checks
      expect(protocol.id).toBeDefined();
      expect(protocol.tripId).toBe('nyc-london');
      expect(protocol.direction).toBe('eastward');
      expect(protocol.days.length).toBeGreaterThan(0);
      expect(protocol.estimatedDaysToAdjust).toBeGreaterThan(0);
      expect(protocol.adjustmentRatePerDay).toBeGreaterThan(0);

      console.log('\n=== NYC → London (Eastward +5h) ===');
      console.log(`Days in protocol: ${protocol.days.length}`);
      console.log(`Estimated adjustment: ${protocol.estimatedDaysToAdjust} days`);
      console.log(`Adjustment rate: ${protocol.adjustmentRatePerDay.toFixed(1)}h/day`);

      // Count interventions by type
      const counts: Record<string, number> = {};
      protocol.days.forEach((day) => {
        day.interventions.forEach((i) => {
          counts[i.type] = (counts[i.type] || 0) + 1;
        });
      });
      console.log('Intervention counts:', counts);
    });

    it('schedules morning light for eastward phase advance', () => {
      const protocol = generateProtocol({
        trip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const lightInterventions = protocol.days.flatMap((day) =>
        day.interventions.filter((i) => i.type === 'light_exposure')
      );

      expect(lightInterventions.length).toBeGreaterThan(0);

      // Morning light should be scheduled for phase advance
      const morningLight = lightInterventions.filter((i) => {
        const hour = parseInt(i.startTime.split(':')[0]);
        return hour >= 5 && hour <= 12;
      });

      expect(morningLight.length).toBeGreaterThan(0);
      console.log(`Morning light interventions: ${morningLight.length}`);
    });
  });

  describe('Scenario 2: London → LA (Westward -8h, 10 days)', () => {
    const trip = createTrip({
      id: 'london-la',
      name: 'London to Los Angeles',
      originCity: 'London',
      originTimezone: 'Europe/London',
      originAirport: 'LHR',
      originOffsetMinutes: 0,
      destinationCity: 'Los Angeles',
      destinationTimezone: 'America/Los_Angeles',
      destinationAirport: 'LAX',
      destinationOffsetMinutes: -480,
      flightDuration: 660,
      timezoneShiftHours: -8,
      direction: 'westward',
      tripDurationDays: 10,
    });

    it('generates valid westward protocol', () => {
      const protocol = generateProtocol({
        trip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      expect(protocol.direction).toBe('westward');
      expect(protocol.days.length).toBeGreaterThan(0);

      console.log('\n=== London → LA (Westward -8h) ===');
      console.log(`Days in protocol: ${protocol.days.length}`);
      console.log(`Estimated adjustment: ${protocol.estimatedDaysToAdjust} days`);
      console.log(`Adjustment rate: ${protocol.adjustmentRatePerDay.toFixed(1)}h/day`);

      const counts: Record<string, number> = {};
      protocol.days.forEach((day) => {
        day.interventions.forEach((i) => {
          counts[i.type] = (counts[i.type] || 0) + 1;
        });
      });
      console.log('Intervention counts:', counts);
    });

    it('has faster adjustment rate than equivalent eastward trip', () => {
      const westProtocol = generateProtocol({
        trip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const eastTrip = createTrip({
        ...trip,
        id: 'east-8h',
        timezoneShiftHours: 8,
        direction: 'eastward',
      });

      const eastProtocol = generateProtocol({
        trip: eastTrip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      // Westward should be easier (faster adjustment or fewer days needed)
      expect(westProtocol.estimatedDaysToAdjust).toBeLessThanOrEqual(
        eastProtocol.estimatedDaysToAdjust
      );
      console.log(
        `Westward: ${westProtocol.estimatedDaysToAdjust} days vs Eastward: ${eastProtocol.estimatedDaysToAdjust} days`
      );
    });
  });

  describe('Scenario 3: NYC → Tokyo (Eastward +14h, 14 days)', () => {
    const trip = createTrip({
      id: 'nyc-tokyo',
      name: 'NYC to Tokyo',
      originCity: 'New York',
      originTimezone: 'America/New_York',
      originAirport: 'JFK',
      originOffsetMinutes: -300,
      destinationCity: 'Tokyo',
      destinationTimezone: 'Asia/Tokyo',
      destinationAirport: 'NRT',
      destinationOffsetMinutes: 540,
      flightDuration: 840,
      timezoneShiftHours: 14,
      direction: 'eastward',
      tripDurationDays: 14,
    });

    it('handles large timezone shift', () => {
      const protocol = generateProtocol({
        trip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      expect(protocol.days.length).toBeGreaterThan(0);
      // Large shifts need more days to adjust
      expect(protocol.estimatedDaysToAdjust).toBeGreaterThan(5);

      console.log('\n=== NYC → Tokyo (Eastward +14h) ===');
      console.log(`Days in protocol: ${protocol.days.length}`);
      console.log(`Estimated adjustment: ${protocol.estimatedDaysToAdjust} days`);
      console.log(`Adjustment rate: ${protocol.adjustmentRatePerDay.toFixed(1)}h/day`);

      const counts: Record<string, number> = {};
      protocol.days.forEach((day) => {
        day.interventions.forEach((i) => {
          counts[i.type] = (counts[i.type] || 0) + 1;
        });
      });
      console.log('Intervention counts:', counts);

      // Show day-by-day progress
      console.log('\nDay-by-day adjustment progress:');
      protocol.days.forEach((day) => {
        const bar = '█'.repeat(Math.round(day.adjustmentProgress / 10));
        console.log(
          `  Day ${day.dayNumber.toString().padStart(2)}: ${bar.padEnd(10)} ${day.adjustmentProgress}%`
        );
      });
    });

    it('generates more interventions than shorter trips', () => {
      const largeProtocol = generateProtocol({
        trip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const smallTrip = createTrip({
        id: 'small-shift',
        timezoneShiftHours: 3,
        direction: 'eastward',
        tripDurationDays: 7,
      });

      const smallProtocol = generateProtocol({
        trip: smallTrip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const largeTotal = largeProtocol.days.reduce((acc, d) => acc + d.interventions.length, 0);
      const smallTotal = smallProtocol.days.reduce((acc, d) => acc + d.interventions.length, 0);

      expect(largeTotal).toBeGreaterThan(smallTotal);
      console.log(`Large trip interventions: ${largeTotal} vs Small trip: ${smallTotal}`);
    });
  });

  describe('Scenario 4: Sydney → Dubai (Westward -7h, 5 days)', () => {
    const trip = createTrip({
      id: 'sydney-dubai',
      name: 'Sydney to Dubai',
      originCity: 'Sydney',
      originTimezone: 'Australia/Sydney',
      originAirport: 'SYD',
      originOffsetMinutes: 660,
      destinationCity: 'Dubai',
      destinationTimezone: 'Asia/Dubai',
      destinationAirport: 'DXB',
      destinationOffsetMinutes: 240,
      flightDuration: 840,
      timezoneShiftHours: -7,
      direction: 'westward',
      tripDurationDays: 5,
    });

    it('generates protocol for short trip', () => {
      const protocol = generateProtocol({
        trip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      expect(protocol.days.length).toBeGreaterThan(0);
      expect(protocol.direction).toBe('westward');

      console.log('\n=== Sydney → Dubai (Westward -7h) ===');
      console.log(`Days in protocol: ${protocol.days.length}`);
      console.log(`Estimated adjustment: ${protocol.estimatedDaysToAdjust} days`);
      console.log(`Adjustment rate: ${protocol.adjustmentRatePerDay.toFixed(1)}h/day`);

      const counts: Record<string, number> = {};
      protocol.days.forEach((day) => {
        day.interventions.forEach((i) => {
          counts[i.type] = (counts[i.type] || 0) + 1;
        });
      });
      console.log('Intervention counts:', counts);
    });

    it('includes essential intervention types', () => {
      const protocol = generateProtocol({
        trip,
        circadianProfile: testProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const allTypes = new Set<string>();
      protocol.days.forEach((day) => {
        day.interventions.forEach((i) => {
          allTypes.add(i.type);
        });
      });

      // Should include light exposure at minimum
      expect(allTypes.has('light_exposure')).toBe(true);

      console.log('Intervention types present:', Array.from(allTypes).join(', '));
    });
  });

  describe('Comparison Summary', () => {
    it('compares all 4 scenarios side by side', () => {
      const scenarios = [
        {
          name: 'NYC → London',
          trip: createTrip({
            id: 'nyc-london',
            timezoneShiftHours: 5,
            direction: 'eastward' as const,
            tripDurationDays: 7,
          }),
        },
        {
          name: 'London → LA',
          trip: createTrip({
            id: 'london-la',
            timezoneShiftHours: -8,
            direction: 'westward' as const,
            tripDurationDays: 10,
          }),
        },
        {
          name: 'NYC → Tokyo',
          trip: createTrip({
            id: 'nyc-tokyo',
            timezoneShiftHours: 14,
            direction: 'eastward' as const,
            tripDurationDays: 14,
          }),
        },
        {
          name: 'Sydney → Dubai',
          trip: createTrip({
            id: 'sydney-dubai',
            timezoneShiftHours: -7,
            direction: 'westward' as const,
            tripDurationDays: 5,
          }),
        },
      ];

      console.log('\n\n========================================');
      console.log('   MULTI-TRIP COMPARISON SUMMARY');
      console.log('========================================\n');

      console.log(
        '| Trip             | Shift  | Dir     | Days | Est.Adj | Rate   | Interventions |'
      );
      console.log(
        '|------------------|--------|---------|------|---------|--------|---------------|'
      );

      scenarios.forEach(({ name, trip }) => {
        const protocol = generateProtocol({
          trip,
          circadianProfile: testProfile,
          preferences: DEFAULT_USER_PREFERENCES,
        });

        const totalInterventions = protocol.days.reduce((acc, d) => acc + d.interventions.length, 0);
        const shift =
          trip.timezoneShiftHours > 0
            ? `+${trip.timezoneShiftHours}h`
            : `${trip.timezoneShiftHours}h`;

        console.log(
          `| ${name.padEnd(16)} | ${shift.padStart(6)} | ${trip.direction.padEnd(7)} | ${protocol.days.length.toString().padStart(4)} | ${protocol.estimatedDaysToAdjust.toString().padStart(7)} | ${protocol.adjustmentRatePerDay.toFixed(1).padStart(5)}h | ${totalInterventions.toString().padStart(13)} |`
        );

        expect(protocol.days.length).toBeGreaterThan(0);
        expect(protocol.estimatedDaysToAdjust).toBeGreaterThan(0);
      });

      console.log('');
      console.log('✓ All 4 travel scenarios generated valid protocols!');
    });
  });
});
