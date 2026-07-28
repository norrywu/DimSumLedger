import { createStore } from "zustand/vanilla";

import type { AuthUser } from "@/types/auth";

export type AuthState = {
  user: AuthUser | null;
};

export type AuthActions = {
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
};

export type AuthStore = AuthState & AuthActions;

export const defaultAuthState: AuthState = { user: null };

/**
 * Factory, bukan store global. Setiap request SSR harus mendapat instance
 * sendiri — store singleton akan tetap hidup di memori server dan bocor
 * antar user.
 *
 * Tanda kurung ganda `createStore<AuthStore>()(...)` wajib; bentuk satu
 * kurung merusak inferensi TypeScript.
 */
export const createAuthStore = (initState: AuthState = defaultAuthState) =>
  createStore<AuthStore>()((set) => ({
    ...initState,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
  }));
