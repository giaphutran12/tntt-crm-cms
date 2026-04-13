import { describe, expect, it } from "vitest";
import {
  STAFF_SIGNUP_GATE_UNLOCKED_VALUE,
  isSharedAccessPasswordValid,
  isStaffSignupGateUnlocked,
} from "./shared-signup-gate";

describe("shared signup gate", () => {
  it("accepts the exact configured password", () => {
    expect(isSharedAccessPasswordValid("secret", "secret")).toBe(true);
  });

  it("rejects empty or mismatched passwords", () => {
    expect(isSharedAccessPasswordValid("", "secret")).toBe(false);
    expect(isSharedAccessPasswordValid("secret ", "secret")).toBe(false);
    expect(isSharedAccessPasswordValid("other", "secret")).toBe(false);
  });

  it("recognizes the unlocked cookie value", () => {
    expect(isStaffSignupGateUnlocked(STAFF_SIGNUP_GATE_UNLOCKED_VALUE)).toBe(true);
    expect(isStaffSignupGateUnlocked("anything-else")).toBe(false);
  });
});
