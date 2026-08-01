"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // QueryClient ADALAH cache-nya sendiri, jadi identitasnya harus stabil.
  //
  // `const client = new QueryClient()` polos di body komponen membuatnya lahir
  // ulang tiap render dan state mutation ikut hilang: klik Save di sheet
  // profil bikin `isPending` langsung balik false, spinner mati padahal
  // request masih jalan, dan toast tidak pernah muncul.
  //
  // Memindahkannya ke module scope memperbaiki itu tapi menimbulkan masalah
  // yang lebih besar: "use client" tetap dirender di server saat SSR, dan
  // variabel module scope hidup di memori proses server untuk SEMUA request —
  // cache user A bocor ke user B. Persis alasan `createAuthStore` dibuat
  // factory; lihat komentarnya di `@/store/auth-store`.
  //
  // Initializer `useState` jalan tepat sekali per instance komponen, jadi dapat
  // dua-duanya. Bukan `useMemo` (React boleh membuang cache memo, tidak
  // dijamin bertahan) dan bukan `useRef` (baca `.current` saat render dilarang
  // React Compiler yang aktif di proyek ini — lihat `auth-store-provider`).
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
