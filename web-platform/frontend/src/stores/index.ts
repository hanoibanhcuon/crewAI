import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem("access_token", token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("access_token");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  theme: "light" | "dark" | "system";
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileMenuOpen: false,
      theme: "system",
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        // Don't persist mobileMenuOpen
      }),
    }
  )
);
