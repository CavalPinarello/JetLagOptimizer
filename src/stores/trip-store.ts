import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Trip, TripStatus } from '@/types/trip';
import type { Protocol } from '@/types/protocol';

interface TripState {
  // Trip data
  trips: Trip[];
  activeTrip: Trip | null;
  activeProtocol: Protocol | null;

  // Loading states
  isLoading: boolean;
  isGeneratingProtocol: boolean;
  error: string | null;

  // Actions - Trip CRUD
  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, updates: Partial<Trip>) => void;
  deleteTrip: (tripId: string) => void;
  setActiveTrip: (tripId: string | null) => void;

  // Actions - Protocol
  setActiveProtocol: (protocol: Protocol | null) => void;
  updateProtocolDay: (
    dayNumber: number,
    updates: Partial<Protocol['days'][0]>
  ) => void;
  markInterventionComplete: (
    dayNumber: number,
    interventionId: string,
    completed: boolean
  ) => void;

  // Actions - Status
  setLoading: (loading: boolean) => void;
  setGeneratingProtocol: (generating: boolean) => void;
  setError: (error: string | null) => void;

  // Utilities
  getTripsByStatus: (status: TripStatus) => Trip[];
  getUpcomingTrips: () => Trip[];
  reset: () => void;
}

const initialState = {
  trips: [],
  activeTrip: null,
  activeProtocol: null,
  isLoading: false,
  isGeneratingProtocol: false,
  error: null,
};

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addTrip: (trip) =>
        set((state) => ({
          trips: [...state.trips, trip],
        })),

      updateTrip: (tripId, updates) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
          activeTrip:
            state.activeTrip?.id === tripId
              ? { ...state.activeTrip, ...updates, updatedAt: new Date() }
              : state.activeTrip,
        })),

      deleteTrip: (tripId) =>
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== tripId),
          activeTrip:
            state.activeTrip?.id === tripId ? null : state.activeTrip,
          activeProtocol:
            state.activeProtocol?.tripId === tripId
              ? null
              : state.activeProtocol,
        })),

      setActiveTrip: (tripId) =>
        set((state) => ({
          activeTrip: tripId
            ? state.trips.find((t) => t.id === tripId) || null
            : null,
          // Clear protocol when switching trips
          activeProtocol:
            tripId && state.activeProtocol?.tripId === tripId
              ? state.activeProtocol
              : null,
        })),

      setActiveProtocol: (protocol) =>
        set({
          activeProtocol: protocol,
        }),

      updateProtocolDay: (dayNumber, updates) =>
        set((state) => {
          if (!state.activeProtocol) return state;

          return {
            activeProtocol: {
              ...state.activeProtocol,
              days: state.activeProtocol.days.map((d) =>
                d.dayNumber === dayNumber ? { ...d, ...updates } : d
              ),
            },
          };
        }),

      markInterventionComplete: (dayNumber, interventionId, completed) =>
        set((state) => {
          if (!state.activeProtocol) return state;

          return {
            activeProtocol: {
              ...state.activeProtocol,
              days: state.activeProtocol.days.map((day) => {
                if (day.dayNumber !== dayNumber) return day;

                return {
                  ...day,
                  interventions: day.interventions.map((intervention) => {
                    if (intervention.id !== interventionId) return intervention;

                    return {
                      ...intervention,
                      completed,
                      completedAt: completed ? new Date() : undefined,
                    };
                  }),
                };
              }),
            },
          };
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setGeneratingProtocol: (isGeneratingProtocol) =>
        set({ isGeneratingProtocol }),

      setError: (error) => set({ error }),

      getTripsByStatus: (status) => {
        return get().trips.filter((t) => t.status === status);
      },

      getUpcomingTrips: () => {
        const now = new Date();
        return get()
          .trips.filter(
            (t) =>
              t.status === 'upcoming' &&
              new Date(t.departureDateTime) > now
          )
          .sort(
            (a, b) =>
              new Date(a.departureDateTime).getTime() -
              new Date(b.departureDateTime).getTime()
          );
      },

      reset: () => set(initialState),
    }),
    {
      name: 'jetlag-trip-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        trips: state.trips,
        activeTrip: state.activeTrip,
      }),
    }
  )
);

/**
 * Helper hook to get the next upcoming trip
 */
export function useNextTrip(): Trip | null {
  const trips = useTripStore((state) => state.trips);
  const now = new Date();

  const upcoming = trips
    .filter(
      (t) => t.status === 'upcoming' && new Date(t.departureDateTime) > now
    )
    .sort(
      (a, b) =>
        new Date(a.departureDateTime).getTime() -
        new Date(b.departureDateTime).getTime()
    );

  return upcoming[0] || null;
}

/**
 * Helper hook to get active trip with protocol
 */
export function useActiveTripWithProtocol(): {
  trip: Trip | null;
  protocol: Protocol | null;
} {
  const activeTrip = useTripStore((state) => state.activeTrip);
  const activeProtocol = useTripStore((state) => state.activeProtocol);

  return { trip: activeTrip, protocol: activeProtocol };
}

/**
 * Helper to get today's protocol day
 */
export function useTodayProtocolDay(): Protocol['days'][0] | null {
  const protocol = useTripStore((state) => state.activeProtocol);

  if (!protocol) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    protocol.days.find((d) => {
      const dayDate = new Date(d.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    }) || null
  );
}
