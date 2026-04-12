import { createClient } from "@supabase/supabase-js";
import {
  getRequiredSupabaseServiceRoleKey,
  getRequiredSupabaseUrl,
} from "@/lib/env";

export function createSupabaseAdminClient() {
  return createClient(
    getRequiredSupabaseUrl(),
    getRequiredSupabaseServiceRoleKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
