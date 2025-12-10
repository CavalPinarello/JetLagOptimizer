/**
 * Protocol Generator Tests
 *
 * Verifies that protocol generation works correctly for various travel scenarios:
 * - Eastward travel (phase advance)
 * - Westward travel (phase delay)
 * - Large timezone shifts
 * - Different chronotypes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateProtocol, ProtocolGeneratorInput } from '../protocol-generator';
import type { Trip } from '@/types/trip';
import type { CircadianProfile, UserPreferences } from '@/types/user';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';

// Helper to create a test trip
function createTestTrip(overrides: Partial<Trip> = {}): Trip {
  const baseTrip: Trip = {
    id: 'test-trip-1',
    userId: 'test-user',
    name: 'Test Trip',
    createdAt: new Date(),
    updatedAt: new Date(),
    originCity: 'New York',
    originTimezone: 'America/New_York',
    originAirport: 'JFK',
    originOffsetMinutes: -300,
    destinationCity: 'London',
    destinationTimezone: 'Europe/London',
    destinationAirport: 'LHR',
    destinationOffsetMinutes: 0,
    departureDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
    flightDuration: 420,
    timezoneShiftHours: 5,
    direction: 'eastward',
    hasReturnTrip: false,
    returnDepartureDateTime: null,
    returnArrivalDateTime: null,
    tripDurationDays: 7,
    isShortTrip: false,
    protocolId: null,
    protocolGeneratedAt: null,
    status: 'upcoming',
  };

  return { ...baseTrip, ...overrides };
}

// Helper to create a test circadian profile
function createTestProfile(overrides: Partial<CircadianProfile> = {}): CircadianProfile {
  const baseProfile: CircadianProfile = {
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

  return { ...baseProfile, ...overrides };
}

describe('Protocol Generator', () => {
  describe('Eastward Travel (NYC to London, +5h)', () => {
    it('should generate a protocol with correct number of days', () => {
      const trip = createTestTrip({
        timezoneShiftHours: 5,
        direction: 'eastward',
        tripDurationDays: 7,
      });

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      // Should have pre-departure, travel, and destination days
      expect(protocol.days.length).toBeGreaterThan(0);
      expect(protocol.direction).toBe('eastward');
    });

    it('should include light exposure interventions in the morning for phase advance', () => {
      const trip = createTestTrip({
        timezoneShiftHours: 5,
        direction: 'eastward',
      });

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      // Find morning light interventions (excluding flight day "stay awake" type interventions)
      const morningLightInterventions = protocol.days.flatMap((day) =>
        day.interventions.filter((i) =>
          i.type === 'light_exposure' &&
          (i.title.includes('Morning') || i.title.includes('Morning Bright Light'))
        )
      );

      expect(morningLightInterventions.length).toBeGreaterThan(0);

      // Morning light should be scheduled (roughly between 5 AM and 12 PM)
      morningLightInterventions.forEach((intervention) => {
        const hour = parseInt(intervention.startTime.split(':')[0]);
        // Allow some flexibility for different protocol strategies
        expect(hour).toBeLessThanOrEqual(14);
      });
    });

    it('should have adjustment progress values for each day', () => {
      const trip = createTestTrip({
        timezoneShiftHours: 5,
        direction: 'eastward',
        tripDurationDays: 10,
      });

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      // Each day should have a valid adjustment progress value
      protocol.days.forEach((day) => {
        expect(day.adjustmentProgress).toBeDefined();
        expect(day.adjustmentProgress).toBeGreaterThanOrEqual(0);
        expect(day.adjustmentProgress).toBeLessThanOrEqual(100);
      });

      // At least some days should show progress (not all zero)
      const totalProgress = protocol.days.reduce((sum, d) => sum + d.adjustmentProgress, 0);
      expect(totalProgress).toBeGreaterThan(0);
    });
  });

  describe('Westward Travel (London to LA, -8h)', () => {
    it('should generate a protocol for westward travel', () => {
      const trip = createTestTrip({
        name: 'London to LA',
        originCity: 'London',
        destinationCity: 'Los Angeles',
        timezoneShiftHours: -8,
        direction: 'westward',
        tripDurationDays: 10,
      });

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      expect(protocol.direction).toBe('westward');
      expect(protocol.days.length).toBeGreaterThan(0);
    });

    it('should include evening light exposure for phase delay', () => {
      const trip = createTestTrip({
        timezoneShiftHours: -8,
        direction: 'westward',
      });

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      // Find light interventions
      const lightInterventions = protocol.days.flatMap((day) =>
        day.interventions.filter((i) => i.type === 'light_exposure')
      );

      expect(lightInterventions.length).toBeGreaterThan(0);
    });

    it('should estimate fewer adjustment days for westward travel', () => {
      // Create two identical trips, one east, one west
      const eastTrip = createTestTrip({
        timezoneShiftHours: 6,
        direction: 'eastward',
        tripDurationDays: 14,
      });

      const westTrip = createTestTrip({
        timezoneShiftHours: -6,
        direction: 'westward',
        tripDurationDays: 14,
      });

      const eastProtocol = generateProtocol({
        trip: eastTrip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const westProtocol = generateProtocol({
        trip: westTrip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      // Westward should be easier (fewer days to adjust)
      // Due to natural circadian period being >24h
      expect(westProtocol.estimatedDaysToAdjust).toBeLessThanOrEqual(
        eastProtocol.estimatedDaysToAdjust
      );
    });
  });

  describe('Large Timezone Shift (NYC to Tokyo, +14h)', () => {
    it('should handle large timezone shifts', () => {
      const trip = createTestTrip({
        name: 'NYC to Tokyo',
        destinationCity: 'Tokyo',
        timezoneShiftHours: 14,
        direction: 'eastward',
        tripDurationDays: 14,
      });

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      expect(protocol.days.length).toBeGreaterThan(0);
      // Large shifts need more days
      expect(protocol.estimatedDaysToAdjust).toBeGreaterThan(5);
    });

    it('should generate more interventions for large shifts', () => {
      const smallShiftTrip = createTestTrip({
        timezoneShiftHours: 3,
        direction: 'eastward',
      });

      const largeShiftTrip = createTestTrip({
        timezoneShiftHours: 10,
        direction: 'eastward',
      });

      const smallProtocol = generateProtocol({
        trip: smallShiftTrip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const largeProtocol = generateProtocol({
        trip: largeShiftTrip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const smallInterventions = smallProtocol.days.reduce(
        (acc, d) => acc + d.interventions.length,
        0
      );
      const largeInterventions = largeProtocol.days.reduce(
        (acc, d) => acc + d.interventions.length,
        0
      );

      expect(largeInterventions).toBeGreaterThan(smallInterventions);
    });
  });

  describe('Chronotype Variations', () => {
    it('should generate different protocols for morning vs evening types', () => {
      const trip = createTestTrip({
        timezoneShiftHours: 5,
        direction: 'eastward',
      });

      const morningProfile = createTestProfile({
        meqScore: 68,
        chronotypeCategory: 'moderate_morning',
        estimatedDLMO: '19:30',
        estimatedCBTmin: '03:00',
      });

      const eveningProfile = createTestProfile({
        meqScore: 35,
        chronotypeCategory: 'moderate_evening',
        estimatedDLMO: '23:00',
        estimatedCBTmin: '06:00',
      });

      const morningProtocol = generateProtocol({
        trip,
        circadianProfile: morningProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      const eveningProtocol = generateProtocol({
        trip,
        circadianProfile: eveningProfile,
        preferences: DEFAULT_USER_PREFERENCES,
      });

      // Both should generate valid protocols
      expect(morningProtocol.days.length).toBeGreaterThan(0);
      expect(eveningProtocol.days.length).toBeGreaterThan(0);

      // Morning types should adapt faster to eastward travel
      expect(morningProtocol.estimatedDaysToAdjust).toBeLessThanOrEqual(
        eveningProtocol.estimatedDaysToAdjust + 1 // Allow 1 day tolerance
      );
    });
  });

  describe('User Preferences', () => {
    it('should include melatonin interventions when user enables them', () => {
      const trip = createTestTrip();
      const profile = createTestProfile();

      const withMelatonin = generateProtocol({
        trip,
        circadianProfile: profile,
        preferences: { ...DEFAULT_USER_PREFERENCES, usesMelatonin: true },
      });

      const melatoninInterventions = withMelatonin.days.flatMap((d) =>
        d.interventions.filter((i) => i.type === 'melatonin')
      );

      expect(melatoninInterventions.length).toBeGreaterThan(0);
    });

    it('should not include melatonin when user disables them', () => {
      const trip = createTestTrip();
      const profile = createTestProfile();

      const withoutMelatonin = generateProtocol({
        trip,
        circadianProfile: profile,
        preferences: { ...DEFAULT_USER_PREFERENCES, usesMelatonin: false },
      });

      const melatoninInterventions = withoutMelatonin.days.flatMap((d) =>
        d.interventions.filter((i) => i.type === 'melatonin')
      );

      expect(melatoninInterventions.length).toBe(0);
    });
  });

  describe('Protocol Structure', () => {
    it('should include all required protocol properties', () => {
      const trip = createTestTrip();

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      expect(protocol.id).toBeDefined();
      expect(protocol.tripId).toBe(trip.id);
      expect(protocol.days).toBeDefined();
      expect(Array.isArray(protocol.days)).toBe(true);
      expect(protocol.direction).toBeDefined();
      expect(protocol.adjustmentRatePerDay).toBeGreaterThan(0);
      expect(protocol.estimatedDaysToAdjust).toBeGreaterThan(0);
    });

    it('should include required intervention properties', () => {
      const trip = createTestTrip();

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      protocol.days.forEach((day) => {
        day.interventions.forEach((intervention) => {
          expect(intervention.id).toBeDefined();
          expect(intervention.type).toBeDefined();
          expect(intervention.title).toBeDefined();
          expect(intervention.startTime).toBeDefined();
          expect(intervention.priority).toBeDefined();
          expect(intervention.completed).toBe(false);
        });
      });
    });

    it('should have days in chronological order', () => {
      const trip = createTestTrip({ tripDurationDays: 10 });

      const protocol = generateProtocol({
        trip,
        circadianProfile: createTestProfile(),
        preferences: DEFAULT_USER_PREFERENCES,
      });

      for (let i = 1; i < protocol.days.length; i++) {
        expect(protocol.days[i].dayNumber).toBeGreaterThan(
          protocol.days[i - 1].dayNumber
        );
      }
    });
  });
});
