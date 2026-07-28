"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan service worker. Dirender di root layout supaya berjalan di
 * semua halaman — bukan hanya halaman yang kebetulan memuat komponen PWA.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => {
        console.error("Service worker gagal terdaftar:", error);
      });
  }, []);

  return null;
}
