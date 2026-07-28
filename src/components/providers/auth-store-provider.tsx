"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";

import { createAuthStore, type AuthStore } from "@/store/auth-store";
import type { AuthUser } from "@/types/auth";

const AuthStoreContext = createContext<ReturnType<
  typeof createAuthStore
> | null>(null);

export function AuthStoreProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: AuthUser | null;
}) {
  // Initializer malas: store dibuat sekali saja dan tidak pernah dibuat ulang
  // saat provider re-render. Skill zustand menyarankan useRef, tapi React
  // Compiler di project ini melarang membaca ref saat render — useState dengan
  // initializer memberi jaminan yang sama tanpa melanggar aturan itu.
  const [store] = useState(() => createAuthStore({ user }));

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  );
}

/** Selector wajib atomik (mis. `(s) => s.user`), jangan mengembalikan seluruh
 * state — itu membuat komponen re-render pada setiap perubahan. */
export function useAuthStore<T>(selector: (store: AuthStore) => T): T {
  const store = useContext(AuthStoreContext);

  if (!store) {
    throw new Error("useAuthStore harus dipakai di dalam AuthStoreProvider");
  }

  return useStore(store, selector);
}
