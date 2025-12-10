import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { DEFAULT_USER_PREFERENCES } from '@/types/user';
import type {
  UserProfile,
  CircadianProfile,
  UserPreferences,
  ChronotypeCategory,
} from '@/types/user';

interface UserState {
  // User data
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Authentication status
  isAuthenticated: boolean;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Actions
  setUser: (user: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateCircadianProfile: (profile: CircadianProfile) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  _hasHydrated: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
          error: null,
        }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...updates,
                updatedAt: new Date(),
              }
            : null,
        })),

      updateCircadianProfile: (profile) =>
        set((state) => {
          // If no user exists, create a demo user
          const currentUser = state.user || {
            id: 'demo-user-' + Date.now(),
            email: 'demo@jetlagoptimizer.com',
            name: 'Demo User',
            createdAt: new Date(),
            updatedAt: new Date(),
            circadianProfile: null,
            preferences: DEFAULT_USER_PREFERENCES,
          };

          return {
            user: {
              ...currentUser,
              circadianProfile: profile,
              updatedAt: new Date(),
            },
            isAuthenticated: true,
          };
        }),

      updatePreferences: (preferences) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                preferences: {
                  ...state.user.preferences,
                  ...preferences,
                },
                updatedAt: new Date(),
              }
            : null,
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      logout: () => set(initialState),

      reset: () => set(initialState),
    }),
    {
      name: 'jetlag-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Helper hook to check if user has completed chronotype assessment
 * Returns false during SSR/hydration to prevent hydration mismatch
 */
export function useHasChronotypeAssessment(): boolean {
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((state) => state._hasHydrated);

  // During SSR or before hydration, return false to match server render
  if (!hasHydrated) {
    return false;
  }

  return user !== null && user.circadianProfile !== null && user.circadianProfile !== undefined;
}

/**
 * Hook to wait for store hydration
 */
export function useStoreHydration(): boolean {
  const hasHydrated = useUserStore((state) => state._hasHydrated);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(hasHydrated);
  }, [hasHydrated]);

  return isHydrated;
}

/**
 * Helper hook to get user's chronotype category
 */
export function useChronotype(): ChronotypeCategory | null {
  const user = useUserStore((state) => state.user);
  return user?.circadianProfile?.chronotypeCategory ?? null;
}

/**
 * Helper hook to get user's estimated DLMO
 */
export function useEstimatedDLMO(): string | null {
  const user = useUserStore((state) => state.user);
  return user?.circadianProfile?.estimatedDLMO ?? null;
}
