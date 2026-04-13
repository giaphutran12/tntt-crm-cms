import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getRequiredSupabasePublishableKey, getRequiredSupabaseUrl } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getRequiredSupabaseUrl(),
    getRequiredSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Route handlers and server components may not always permit cookie writes.
          }
        },
      },
    },
  );
}
