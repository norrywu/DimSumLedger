// Hanya variabel berawalan NEXT_PUBLIC_ yang boleh lewat sini — modul ini
// ikut terbawa ke bundel browser lewat `@/lib/supabase/client`.
// Kunci rahasia ada di `./supabase-server`, yang sengaja TIDAK direekspor.
export { supabaseUrl, supabasePublishableKey } from "./supabase";
