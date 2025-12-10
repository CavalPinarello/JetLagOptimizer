import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type TimeFormat = '12h' | '24h';

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Time format
  timeFormat: TimeFormat;
  setTimeFormat: (format: TimeFormat) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown>;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  currentOnboardingStep: number;
  setOnboardingComplete: (complete: boolean) => void;
  setOnboardingStep: (step: number) => void;

  // Notifications/toasts (simple implementation)
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  }>;
  addNotification: (
    notification: Omit<UIState['notifications'][0], 'id'>
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Protocol view preferences
  protocolViewMode: 'timeline' | 'list' | 'cards';
  setProtocolViewMode: (mode: 'timeline' | 'list' | 'cards') => void;
  showCompletedInterventions: boolean;
  setShowCompletedInterventions: (show: boolean) => void;

  // Selected day for protocol view
  selectedProtocolDay: number;
  setSelectedProtocolDay: (day: number) => void;

  reset: () => void;
}

const initialState = {
  theme: 'system' as Theme,
  timeFormat: '24h' as TimeFormat,
  sidebarOpen: true,
  mobileMenuOpen: false,
  activeModal: null,
  modalData: {},
  hasCompletedOnboarding: false,
  currentOnboardingStep: 0,
  notifications: [],
  protocolViewMode: 'timeline' as const,
  showCompletedInterventions: true,
  selectedProtocolDay: 0,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),

      setTimeFormat: (timeFormat) => set({ timeFormat }),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),

      openModal: (modalId, data = {}) =>
        set({
          activeModal: modalId,
          modalData: data,
        }),

      closeModal: () =>
        set({
          activeModal: null,
          modalData: {},
        }),

      setOnboardingComplete: (hasCompletedOnboarding) =>
        set({ hasCompletedOnboarding }),

      setOnboardingStep: (currentOnboardingStep) =>
        set({ currentOnboardingStep }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: crypto.randomUUID(),
            },
          ],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      setProtocolViewMode: (protocolViewMode) => set({ protocolViewMode }),

      setShowCompletedInterventions: (showCompletedInterventions) =>
        set({ showCompletedInterventions }),

      setSelectedProtocolDay: (selectedProtocolDay) =>
        set({ selectedProtocolDay }),

      reset: () => set(initialState),
    }),
    {
      name: 'jetlag-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        timeFormat: state.timeFormat,
        sidebarOpen: state.sidebarOpen,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        protocolViewMode: state.protocolViewMode,
        showCompletedInterventions: state.showCompletedInterventions,
      }),
    }
  )
);

/**
 * Helper hook for theme management
 */
export function useTheme() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system'
      ? typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  return { theme, setTheme, resolvedTheme };
}

/**
 * Helper hook for modal management
 */
export function useModal(modalId: string) {
  const activeModal = useUIStore((state) => state.activeModal);
  const modalData = useUIStore((state) => state.modalData);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);

  return {
    isOpen: activeModal === modalId,
    data: modalData,
    open: (data?: Record<string, unknown>) => openModal(modalId, data),
    close: closeModal,
  };
}

/**
 * Helper hook for notifications
 */
export function useNotifications() {
  const notifications = useUIStore((state) => state.notifications);
  const addNotification = useUIStore((state) => state.addNotification);
  const removeNotification = useUIStore((state) => state.removeNotification);
  const clearNotifications = useUIStore((state) => state.clearNotifications);

  const notify = {
    success: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'info', title, message, duration }),
  };

  return {
    notifications,
    notify,
    remove: removeNotification,
    clear: clearNotifications,
  };
}
