"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getSafeAuthRedirectPath } from "@/lib/auth/session";
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
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(getSignInErrorRedirect("invalid-credentials", nextPath));
  }

  redirect(nextPath);
}
