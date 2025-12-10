import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserProfile,
  CircadianProfile,
  UserPreferences,
  ChronotypeCategory,
  DEFAULT_USER_PREFERENCES,
} from '@/types/user';

interface UserState {
  // User data
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Authentication status
  isAuthenticated: boolean;

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
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

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
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                circadianProfile: profile,
                updatedAt: new Date(),
              }
            : null,
        })),

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
    }
  )
);

/**
 * Helper hook to check if user has completed chronotype assessment
 */
export function useHasChronotypeAssessment(): boolean {
  const user = useUserStore((state) => state.user);
  return user?.circadianProfile !== null;
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
