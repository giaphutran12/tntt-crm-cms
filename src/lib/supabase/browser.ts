import { createBrowserClient } from "@supabase/ssr";
import { getRequiredSupabaseAnonKey, getRequiredSupabaseUrl } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    getRequiredSupabaseUrl(),
    getRequiredSupabaseAnonKey(),
  );
}
