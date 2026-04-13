import { describe, expect, it } from "vitest";
import {
  canAccessAdminSettings,
  canAccessContent,
  canAccessCrm,
  getRoleLabel,
  hasMinimumRole,
  normalizeAppRole,
} from "./roles";

describe("app roles", () => {
  it("normalizes current and legacy role names", () => {
    expect(normalizeAppRole("editor")).toBe("editor");
    expect(normalizeAppRole("operations")).toBe("operations");
    expect(normalizeAppRole("admin")).toBe("admin");
    expect(normalizeAppRole("HT")).toBe("editor");
    expect(normalizeAppRole(" ht ")).toBe("editor");
    expect(normalizeAppRole("unknown")).toBeNull();
  });

  it("applies the intended access ladder", () => {
    expect(hasMinimumRole("editor", "editor")).toBe(true);
    expect(hasMinimumRole("editor", "operations")).toBe(false);
    expect(hasMinimumRole("operations", "editor")).toBe(true);
    expect(hasMinimumRole("admin", "operations")).toBe(true);
  });

  it("separates content, CRM, and admin settings access", () => {
    expect(canAccessContent("editor")).toBe(true);
    expect(canAccessCrm("editor")).toBe(false);
    expect(canAccessCrm("operations")).toBe(true);
    expect(canAccessAdminSettings("operations")).toBe(false);
    expect(canAccessAdminSettings("admin")).toBe(true);
  });

  it("returns stable role labels", () => {
    expect(getRoleLabel("editor")).toBe("Editor");
    expect(getRoleLabel("operations")).toBe("Operations");
    expect(getRoleLabel("admin")).toBe("Admin");
  });
});
