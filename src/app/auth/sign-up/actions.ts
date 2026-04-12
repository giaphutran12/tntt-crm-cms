"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  STAFF_SIGNUP_GATE_COOKIE,
  STAFF_SIGNUP_GATE_UNLOCKED_VALUE,
  isSharedAccessPasswordValid,
} from "@/lib/auth/shared-signup-gate";
import { getStaffSignupSharedPassword } from "@/lib/env";

export async function unlockStaffSignup(formData: FormData) {
  const suppliedPassword = formData.get("sharedPassword");
  const configuredPassword = getStaffSignupSharedPassword();

  if (!configuredPassword) {
    redirect("/auth/sign-up?error=missing-config");
  }

  if (
    !isSharedAccessPasswordValid(
      typeof suppliedPassword === "string" ? suppliedPassword : "",
      configuredPassword,
    )
  ) {
    redirect("/auth/sign-up?error=invalid-password");
  }

  const cookieStore = await cookies();

  cookieStore.set(STAFF_SIGNUP_GATE_COOKIE, STAFF_SIGNUP_GATE_UNLOCKED_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });

  redirect("/auth/sign-up?gate=unlocked");
}

export async function lockStaffSignup() {
  const cookieStore = await cookies();

  cookieStore.delete(STAFF_SIGNUP_GATE_COOKIE);
  redirect("/auth/sign-up");
}
