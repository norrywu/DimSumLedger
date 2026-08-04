import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabasePublishableKey, supabaseUrl } from "@/environments";

import type { AppMetadata } from "@/types/auth";
import { isManagerRole } from "../auth-guard";

export const PREFIX_ADMIN = "/APP/admin";

/** Layar utama kasir, tujuan pantulan saat yang bukan pengelola masuk /APP/admin. */
export const BERANDA_KASIR = "/APP/cashier/order";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Penjagaan /APP/admin dikerjakan di sini, bukan hanya di layout: menurut
  // dokumen Next 16, layout TIDAK dirender ulang saat berpindah rute karena
  // Partial Rendering — jadi kasir yang berpindah dari halaman kasir ke halaman
  // admin lewat tautan client-side tidak akan pernah melewati cek layout.
  // Proxy dijalankan tiap request, termasuk permintaan RSC.
  //
  // Klaimnya sudah ditarik di atas untuk keperluan sesi, jadi cek ini tidak
  // menambah satu pun perjalanan jaringan.
  if (user && request.nextUrl.pathname.startsWith(PREFIX_ADMIN)) {
    const appMetadata = user.app_metadata as AppMetadata | undefined;

    if (!isManagerRole(appMetadata?.role)) {
      const url = request.nextUrl.clone();
      url.pathname = BERANDA_KASIR;
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
