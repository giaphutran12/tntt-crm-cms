export const STAFF_SIGNUP_GATE_COOKIE = "tntt_staff_signup_gate";
export const STAFF_SIGNUP_GATE_UNLOCKED_VALUE = "approved";

export function isSharedAccessPasswordValid(
  suppliedPassword: string,
  configuredPassword: string,
) {
  return suppliedPassword.trim().length > 0 && suppliedPassword === configuredPassword;
}

export function isStaffSignupGateUnlocked(cookieValue?: string) {
  return cookieValue === STAFF_SIGNUP_GATE_UNLOCKED_VALUE;
}
