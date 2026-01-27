import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
  role?: 'user' | 'manager' | 'admin'; // 권한 역할
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
}

interface AuthStore extends AuthState {
  setAuthData: (data: Partial<AuthState>) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        isAuthenticated: false,
        user: null,
        isLoading: true,

        // Actions
        setAuthData: (data) =>
          set((state) => ({ ...state, ...data }), false, 'setAuthData'),

        clearAuth: () =>
          set({ isAuthenticated: false, user: null, isLoading: false }, false, 'clearAuth'),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, 'setLoading'),

        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false
          }, false, 'setUser'),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);