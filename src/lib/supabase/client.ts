import { createBrowserClient } from "@supabase/ssr";

import { supabasePublishableKey, supabaseUrl } from "@/environments";
import { Database } from "@/types/supabase";

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
