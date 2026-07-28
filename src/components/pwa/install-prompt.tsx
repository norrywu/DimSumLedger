"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { DownloadIcon, ShareIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// `beforeinstallprompt` belum masuk standar, jadi TypeScript belum punya
// tipenya. Ini bentuk minimal yang benar-benar dipakai di komponen ini.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const STANDALONE_QUERY = "(display-mode: standalone)";

// Saat render di server, `navigator` dan `window` belum ada — keduanya dianggap
// false, lalu React menghitung ulang nilai sebenarnya setelah hydration.
const getServerSnapshot = () => false;

// Jenis perangkat tidak pernah berubah sepanjang sesi, jadi tidak ada apa pun
// yang perlu dilanggani.
const subscribeNever = () => () => {};

function getIsIosSnapshot() {
  const ua = navigator.userAgent;
  // iPadOS 13+ menyamar sebagai "Macintosh", jadi iPad dibedakan dari Mac
  // lewat keberadaan layar sentuh.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

// Mode standalone bisa berubah saat aplikasi dipasang atau dibuka sebagai app,
// jadi perubahannya dilanggani lewat media query.
function subscribeStandalone(onStoreChange: () => void) {
  const mql = window.matchMedia(STANDALONE_QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getIsStandaloneSnapshot() {
  return window.matchMedia(STANDALONE_QUERY).matches;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  // 1. Cek apakah pengguna mengakses dari iOS (iPhone/iPad)
  const isIOS = useSyncExternalStore(
    subscribeNever,
    getIsIosSnapshot,
    getServerSnapshot,
  );

  // 2. Cek apakah aplikasi SUDAH di-install (mode standalone)
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getIsStandaloneSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    // 3. Tangkap event 'beforeinstallprompt' (Khusus Android & Chrome/Edge Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Cegah browser menampilkan banner install bawaan yang tiba-tiba
      e.preventDefault();
      // Simpan event ini ke state agar bisa dipicu lewat tombol kita sendiri
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  // Fungsi saat tombol "Install Application" diklik
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Tampilkan pop-up dialog install bawaan browser
    deferredPrompt.prompt();

    // Tunggu respon dari user (apakah mereka klik "Install" atau "Cancel")
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // Reset prompt karena hanya bisa dipakai 1 kali
    setDeferredPrompt(null);
  };

  // Jika aplikasi SUDAH di-install, jangan tampilkan apa-apa
  if (isStandalone) {
    return null;
  }

  // Android & Chrome/Edge desktop: bisa dipasang langsung lewat dialog browser
  if (deferredPrompt) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleInstallClick}
        title="Install POS Dimsum"
      >
        <DownloadIcon />
        <span className="sr-only">Install POS Dimsum</span>
      </Button>
    );
  }

  // iOS tidak menyediakan dialog install, jadi panduannya ditulis manual
  if (isIOS) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" title="Cara install">
            <DownloadIcon />
            <span className="sr-only">Cara install POS Dimsum</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Install POS Dimsum</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Di Safari, tap tombol Share{" "}
            <ShareIcon className="inline size-3 align-text-bottom" /> lalu pilih{" "}
            <span className="font-medium text-foreground">
              Add to Home Screen
            </span>
            .
          </p>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Browser lain (mis. Firefox/Safari desktop) belum mendukung install PWA
  return null;
}
