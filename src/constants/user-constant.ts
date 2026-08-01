import type { UserMetadata } from "@/types/metadata";

/**
 * Cadangan saat store belum terisi, supaya footer sidebar tidak merender baris
 * kosong. Praktisnya jarang terpakai: `src/proxy.ts` sudah menendang user
 * anonim ke /auth/login sebelum layout /APP sempat dirender.
 */
export const defaultUserMetadata: UserMetadata = {
  name: "Pengguna",
  email: null,
  role: null,
};
