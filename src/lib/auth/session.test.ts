import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

vi.mock("react", () => ({
  cache: <T extends (...args: Array<unknown>) => unknown>(fn: T) => fn,
}));

vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAppUser, getSafeAuthRedirectPath } from "./session";

const mockedCreateSupabaseServerClient = vi.mocked(createSupabaseServerClient);

function buildSupabaseServerClient(options?: {
  appRole?: string | null;
  appRoleError?: { message: string } | null;
  user?: User | null;
}) {
  const maybeSingle = vi.fn(async () => ({
    data: options?.appRole === undefined ? null : { role: options?.appRole ?? null },
    error: options?.appRoleError ?? null,
  }));
  const eq = vi.fn(() => ({
    maybeSingle,
  }));
  const select = vi.fn(() => ({
    eq,
  }));

  const defaultUser = {
    id: "user-1",
    email: "hello@example.com",
    aud: "authenticated",
    created_at: "2026-04-13T00:00:00.000Z",
    app_metadata: {
      app_role: "editor",
      role: "editor",
    },
    user_metadata: {
      full_name: "Edward Tran",
    },
  } as unknown as User;

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: options?.user ?? defaultUser,
        },
      })),
    },
    from: vi.fn(() => ({
      select,
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

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

describe("getCurrentAppUser", () => {
  it("prefers the app_users role over stale auth metadata", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue(
      buildSupabaseServerClient({
        appRole: "admin",
      }) as never,
    );

    await expect(getCurrentAppUser()).resolves.toMatchObject({
      email: "hello@example.com",
      name: "Edward Tran",
      role: "admin",
      roleLabel: "Admin",
    });
  });

  it("falls back to auth metadata when app_users lookup fails", async () => {
    mockedCreateSupabaseServerClient.mockResolvedValue(
      buildSupabaseServerClient({
        appRoleError: { message: "db down" },
      }) as never,
    );

    await expect(getCurrentAppUser()).resolves.toMatchObject({
      role: "editor",
      roleLabel: "Editor",
    });
  });
});
