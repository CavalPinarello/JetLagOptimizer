/**
 * Trip Types
 *
 * Data structures for travel itineraries and timezone calculations.
 * These types are framework-agnostic for Swift portability.
 */

// Direction of travel relative to timezone
export type TripDirection = 'eastward' | 'westward';

// Status of a trip
export type TripStatus = 'upcoming' | 'active' | 'completed' | 'archived';

/**
 * Individual flight leg (for multi-stop journeys)
 */
export interface FlightLeg {
  id: string;
  departureAirport: string;          // IATA code (e.g., 'JFK')
  departureCity: string;
  departureTimezone: string;         // IANA timezone
  arrivalAirport: string;
  arrivalCity: string;
  arrivalTimezone: string;
  departureDateTime: Date;           // Local departure time
  arrivalDateTime: Date;             // Local arrival time
  duration: number;                  // minutes
  layoverAfter?: number;             // minutes until next leg
}

/**
 * Complete trip information
 */
export interface Trip {
  id: string;
  userId: string;
  name: string;                      // User-defined trip name
  createdAt: Date;
  updatedAt: Date;

  // Origin
  originCity: string;
  originAirport?: string;            // Optional IATA code
  originTimezone: string;            // IANA timezone
  originOffsetMinutes: number;       // UTC offset in minutes at departure time

  // Destination
  destinationCity: string;
  destinationAirport?: string;
  destinationTimezone: string;
  destinationOffsetMinutes: number;  // UTC offset in minutes at arrival time

  // Main timing
  departureDateTime: Date;           // Local departure time
  arrivalDateTime: Date;             // Local arrival time
  flightDuration: number;            // Total flight time in minutes

  // Multi-leg support
  legs?: FlightLeg[];                // Optional for complex itineraries

  // Calculated properties
  timezoneShiftHours: number;        // Hours difference (positive = east, negative = west)
  direction: TripDirection;

  // Return trip (optional)
  hasReturnTrip: boolean;
  returnDepartureDateTime: Date | null;
  returnArrivalDateTime: Date | null;

  // Trip metadata
  tripDurationDays: number;          // Days at destination
  isShortTrip: boolean;              // < 3 days (may skip full adjustment)
  purpose?: 'business' | 'leisure' | 'athletic' | 'other';
  notes?: string;

  // Protocol reference
  protocolId: string | null;
  protocolGeneratedAt: Date | null;

  // Status
  status: TripStatus;
}

/**
 * Input for creating a new trip
 */
export interface TripInput {
  name: string;
  originCity: string;
  originTimezone: string;
  destinationCity: string;
  destinationTimezone: string;
  departureDateTime: Date;
  arrivalDateTime: Date;
  returnDepartureDateTime?: Date;
  returnArrivalDateTime?: Date;
  tripDurationDays: number;
  purpose?: 'business' | 'leisure' | 'athletic' | 'other';
  notes?: string;
}

/**
 * Calculate timezone shift between two timezone offsets
 * Returns hours (positive = eastward, negative = westward)
 */
export function calculateTimezoneShift(
  originOffsetMinutes: number,
  destinationOffsetMinutes: number
): number {
  // Difference in hours
  // If dest is ahead of origin (higher offset), we're going east
  return (destinationOffsetMinutes - originOffsetMinutes) / 60;
}

/**
 * Determine travel direction based on timezone shift
 */
export function getTripDirection(timezoneShiftHours: number): TripDirection {
  // Positive shift = eastward (need to advance clock)
  // Negative shift = westward (need to delay clock)
  return timezoneShiftHours >= 0 ? 'eastward' : 'westward';
}

/**
 * Determine if trip should be considered "short" (minimal adjustment recommended)
 * Based on research: trips under 2-3 days may not warrant full adjustment
 */
export function isShortTrip(durationDays: number, timezoneShiftHours: number): boolean {
  const absShift = Math.abs(timezoneShiftHours);

  // Very short stays with large shifts - don't adjust
  if (durationDays <= 2 && absShift >= 5) return true;

  // Short stays with moderate shifts - partial adjustment
  if (durationDays <= 3 && absShift >= 8) return true;

  return false;
}

/**
 * Calculate flight duration from departure and arrival times
 * Accounts for timezone differences
 */
export function calculateFlightDuration(
  departure: Date,
  arrival: Date
): number {
  // Both dates should already be in UTC or comparable format
  return Math.round((arrival.getTime() - departure.getTime()) / (1000 * 60));
}

/**
 * Get estimated days needed for full adjustment
 * Based on typical adaptation rates from circadian research
 *
 * Scientific basis:
 * - Eastward (phase advance) is HARDER: ~1h/day natural, ~1.5h/day with interventions
 * - Westward (phase delay) is EASIER: ~1.5h/day natural, ~2h/day with interventions
 */
export function getEstimatedAdjustmentDays(
  timezoneShiftHours: number,
  withInterventions: boolean = true
): number {
  const absShift = Math.abs(timezoneShiftHours);
  const isEastward = timezoneShiftHours > 0;

  // Eastward = harder (phase advance against natural drift)
  // Westward = easier (phase delay with natural drift)
  let ratePerDay: number;

  if (isEastward) {
    // Phase advance is harder
    ratePerDay = withInterventions ? 1.5 : 1.0;  // ~90 min/day max with help
  } else {
    // Phase delay is easier
    ratePerDay = withInterventions ? 2.0 : 1.5;  // ~2h/day possible
  }

  return Math.ceil(absShift / ratePerDay);
}

/**
 * Get trip status based on dates
 */
export function getTripStatus(trip: Trip): TripStatus {
  const now = new Date();

  if (trip.status === 'archived') return 'archived';

  // Check if we're currently on the trip
  if (now >= trip.departureDateTime) {
    // If there's a return trip, check if we're back
    if (trip.hasReturnTrip && trip.returnArrivalDateTime) {
      if (now > trip.returnArrivalDateTime) {
        return 'completed';
      }
    } else {
      // No return trip - check if past estimated stay duration
      const endDate = new Date(trip.arrivalDateTime);
      endDate.setDate(endDate.getDate() + trip.tripDurationDays);
      if (now > endDate) {
        return 'completed';
      }
    }
    return 'active';
  }

  return 'upcoming';
}
