"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSafeAuthRedirectPath } from "@/lib/auth/session";
import {
  getStaffSignupAvailability,
  provisionStaffUser,
} from "@/lib/auth/staff-user-provisioning";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  STAFF_SIGNUP_GATE_COOKIE,
  STAFF_SIGNUP_GATE_UNLOCKED_VALUE,
  isSharedAccessPasswordValid,
  isStaffSignupGateUnlocked,
} from "@/lib/auth/shared-signup-gate";
import { getStaffSignupSharedPassword } from "@/lib/env";

function getSignUpRedirect(errorCode: string, nextPath: string) {
  return `/auth/sign-up?error=${errorCode}&next=${encodeURIComponent(nextPath)}`;
}

export async function unlockStaffSignup(formData: FormData) {
  const nextValue = formData.get("next");
  const nextPath = getSafeAuthRedirectPath(
    typeof nextValue === "string" ? nextValue : null,
  );
  const suppliedPassword = formData.get("sharedPassword");
  const availability = getStaffSignupAvailability();

  if (availability.status === "unavailable") {
    redirect(getSignUpRedirect("missing-config", nextPath));
  }

  const configuredPassword = getStaffSignupSharedPassword();

  if (
    !configuredPassword ||
    !isSharedAccessPasswordValid(
      typeof suppliedPassword === "string" ? suppliedPassword : "",
      configuredPassword,
    )
  ) {
    redirect(getSignUpRedirect("invalid-password", nextPath));
  }

  const cookieStore = await cookies();

  cookieStore.set(STAFF_SIGNUP_GATE_COOKIE, STAFF_SIGNUP_GATE_UNLOCKED_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });

  redirect(`/auth/sign-up?gate=unlocked&next=${encodeURIComponent(nextPath)}`);
}

export async function signUpStaff(formData: FormData) {
  const nextValue = formData.get("next");
  const nextPath = getSafeAuthRedirectPath(
    typeof nextValue === "string" ? nextValue : null,
  );
  const availability = getStaffSignupAvailability();

  if (availability.status === "unavailable") {
    redirect(getSignUpRedirect("missing-config", nextPath));
  }

  const cookieStore = await cookies();

  if (!isStaffSignupGateUnlocked(cookieStore.get(STAFF_SIGNUP_GATE_COOKIE)?.value)) {
    redirect(getSignUpRedirect("locked", nextPath));
  }

  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const fullNameValue = formData.get("fullName");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const fullName =
    typeof fullNameValue === "string" && fullNameValue.trim().length > 0
      ? fullNameValue.trim()
      : null;

  if (!email || !password) {
    redirect(getSignUpRedirect("missing-fields", nextPath));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName
        ? {
            full_name: fullName,
            name: fullName,
          }
        : undefined,
    },
  });

  if (error || !data.user) {
    const normalizedMessage = error?.message.toLowerCase() ?? "";
    const errorCode = normalizedMessage.includes("already registered")
      ? "email-in-use"
      : normalizedMessage.includes("password")
        ? "weak-password"
        : normalizedMessage.includes("email")
          ? "invalid-email"
          : "sign-up-failed";

    redirect(getSignUpRedirect(errorCode, nextPath));
  }

  try {
    await provisionStaffUser(
      {
        email: data.user.email ?? email,
        fullName,
        userId: data.user.id,
      },
      { cleanupAuthUserOnFailure: true },
    );
  } catch {
    redirect(getSignUpRedirect("provisioning-failed", nextPath));
  }

  cookieStore.delete(STAFF_SIGNUP_GATE_COOKIE);

  if (data.session) {
    redirect(nextPath);
  }

  redirect(`/auth/sign-in?registered=1&next=${encodeURIComponent(nextPath)}`);
}

export async function lockStaffSignup(formData: FormData) {
  const nextValue = formData.get("next");
  const nextPath = getSafeAuthRedirectPath(
    typeof nextValue === "string" ? nextValue : null,
  );
  const cookieStore = await cookies();

  cookieStore.delete(STAFF_SIGNUP_GATE_COOKIE);
  redirect(`/auth/sign-up?next=${encodeURIComponent(nextPath)}`);
}
