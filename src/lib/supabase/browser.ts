import { createBrowserClient } from "@supabase/ssr";
import { getRequiredSupabasePublishableKey, getRequiredSupabaseUrl } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    getRequiredSupabaseUrl(),
    getRequiredSupabasePublishableKey(),
  );
}
