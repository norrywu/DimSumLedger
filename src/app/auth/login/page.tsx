import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/auth/login/_components/login-form";
import { getAuthUser } from "@/servers/auth";
import { siteConfig } from "@/configs/site";
import { UtensilsCrossed } from "lucide-react";

/**
 * Server Component sekarang — `"use client"` di sini tidak pernah dibutuhkan:
 * seluruh isian dan handler-nya sudah ada di `<LoginForm />` yang punya
 * direktifnya sendiri. Sebagai Server Component, sesi bisa diperiksa sebelum
 * satu piksel pun terkirim.
 *
 * `proxy.ts` hanya menendang yang BELUM login masuk ke halaman terlindungi —
 * kebalikannya tidak dijaga siapa pun, jadi yang sudah login masih bisa
 * mendarat di form ini lewat bookmark atau tombol Back.
 */
export default async function LoginPage() {
  const user = await getAuthUser();

  // Ke "/" saja, bukan langsung ke layar perannya: `src/app/page.tsx` sudah
  // jadi persimpangan yang menentukan tujuan per peran. Menduplikasi logika
  // itu di sini berarti dua tempat yang harus diubah bersamaan.
  if (user) redirect("/");

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <UtensilsCrossed className="size-4" />
            </div>
            {siteConfig.company.name}
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/placeholder.svg"
          alt="Keranjang bambu berisi dimsum"
          fill
          unoptimized
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
