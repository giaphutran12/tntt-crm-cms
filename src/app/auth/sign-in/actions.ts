"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getSafeAuthRedirectPath } from "@/lib/auth/session";
import { provisionStaffUser } from "@/lib/auth/staff-user-provisioning";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSignInErrorRedirect(errorCode: string, nextPath: string) {
  return `/auth/sign-in?error=${errorCode}&next=${encodeURIComponent(nextPath)}`;
}

export async function signInStaff(formData: FormData) {
  const nextValue = formData.get("next");
  const nextPath = getSafeAuthRedirectPath(
    typeof nextValue === "string" ? nextValue : null,
  );

  if (!isSupabaseConfigured()) {
    redirect(getSignInErrorRedirect("missing-config", nextPath));
  }

  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    redirect(getSignInErrorRedirect("missing-fields", nextPath));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(getSignInErrorRedirect("invalid-credentials", nextPath));
  }

  if (data.user) {
    try {
      await provisionStaffUser({
        email: data.user.email ?? email,
        fullName:
          typeof data.user.user_metadata.full_name === "string"
            ? data.user.user_metadata.full_name
            : typeof data.user.user_metadata.name === "string"
              ? data.user.user_metadata.name
              : null,
        userId: data.user.id,
      });
    } catch {
      // Sign-in should remain usable even if the app-user sync was already handled
      // by the database trigger and this best-effort refresh fails.
    }
  }

  redirect(nextPath);
}
