import { describe, expect, it } from "vitest";
import { getSafeAuthRedirectPath } from "./session";

describe("getSafeAuthRedirectPath", () => {
  it("keeps safe internal admin routes", () => {
    expect(getSafeAuthRedirectPath("/admin/students")).toBe("/admin/students");
    expect(getSafeAuthRedirectPath("/admin?tab=content")).toBe("/admin?tab=content");
  });

  it("falls back for missing or external next paths", () => {
    expect(getSafeAuthRedirectPath()).toBe("/admin");
    expect(getSafeAuthRedirectPath("https://example.com")).toBe("/admin");
    expect(getSafeAuthRedirectPath("//evil.test")).toBe("/admin");
    expect(getSafeAuthRedirectPath("admin")).toBe("/admin");
  });
});
