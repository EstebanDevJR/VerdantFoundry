import { create } from 'zustand';
import { auth as apiAuth } from '@/lib/api';

export type Theme = 'light' | 'dark' | 'glass';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface AppState {
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  ambientParticles: boolean;
  setAmbientParticles: (on: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  isAuthenticated: apiAuth.isAuthenticated(),
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  isShortcutsOpen: false,
  setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),
  theme: 'glass',
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  },
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Math.random().toString(36).substring(7) }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  ambientParticles: true,
  setAmbientParticles: (on) => set({ ambientParticles: on }),
}));
