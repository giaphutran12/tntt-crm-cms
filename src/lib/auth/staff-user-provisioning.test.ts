import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  listStaffAccessRecords,
  listStaffRoleChangeRecords,
  getStaffRoleMetadata,
  isAppUserAuthForeignKeyRace,
  normalizeRequestedStaffRole,
  provisionStaffUser,
  retryAppUserUpsert,
  updateStaffRole,
} from "./staff-user-provisioning";

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

const mockedCreateSupabaseAdminClient = vi.mocked(createSupabaseAdminClient);

function buildSupabaseAdminClient(options?: {
  adminCount?: number;
  appUsers?: Array<{
    created_at?: string;
    display_name: string | null;
    email: string | null;
    id: string;
    role: "editor" | "operations" | "admin";
    updated_at?: string;
  }>;
  auditEntries?: Array<{
    actor: Array<{ display_name: string | null; email: string | null }> | null;
    created_at: string;
    id: string;
    new_role: "editor" | "operations" | "admin";
    note: string | null;
    old_role: "editor" | "operations" | "admin";
    subject: Array<{ display_name: string | null; email: string | null }> | null;
  }>;
  existingAppUser?: {
    created_at?: string;
    display_name: string | null;
    email: string | null;
    id?: string;
    role: "editor" | "operations" | "admin";
    updated_at?: string;
  } | null;
  existingUser?: {
    app_metadata: Record<string, unknown>;
    email?: string | null;
    id: string;
    user_metadata: Record<string, unknown>;
  };
  getUserError?: Error | null;
  upsertError?: unknown;
}) {
  const existingUser = options?.existingUser ?? {
    id: "user-1",
    email: "staff@example.com",
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {},
  };

  const updateUserById = vi.fn(async (_userId: string, attributes: object) => ({
    data: {
      user: {
        ...existingUser,
        ...attributes,
      },
    },
    error: null,
  }));
  const getUserById = vi.fn(async () => ({
    data: { user: options?.getUserError ? null : existingUser },
    error: options?.getUserError ?? null,
  }));
  const deleteUser = vi.fn(async () => ({
    data: { user: null },
    error: null,
  }));
  const appUsers =
    options?.appUsers ??
    (options?.existingAppUser
      ? [
          {
            id: options.existingAppUser.id ?? "user-1",
            created_at: options.existingAppUser.created_at ?? "2026-04-13T00:00:00.000Z",
            updated_at: options.existingAppUser.updated_at ?? "2026-04-13T00:00:00.000Z",
            ...options.existingAppUser,
          },
        ]
      : []);
  const appUsersById = new Map(appUsers.map((record) => [record.id, record]));
  const updateEq = vi.fn(async (_column: string, value: string) => ({
    data: appUsersById.get(value)
      ? {
          ...appUsersById.get(value),
          role: pendingRoleUpdate ?? appUsersById.get(value)?.role,
        }
      : null,
    error: null,
  }));
  let pendingRoleUpdate: "editor" | "operations" | "admin" | null = null;
  const update = vi.fn((payload: { role?: "editor" | "operations" | "admin" }) => {
    pendingRoleUpdate = payload.role ?? null;
    return {
      eq: vi.fn((_column: string, value: string) => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: appUsersById.get(value)
              ? {
                  ...appUsersById.get(value),
                  role: pendingRoleUpdate ?? appUsersById.get(value)?.role,
                }
              : null,
            error: null,
          })),
        })),
      })),
    };
  });
  const insert = vi.fn(async () => ({
    data: null,
    error: null,
  }));
  const order = vi.fn(() => ({
    limit: vi.fn(async () => ({
      data: options?.auditEntries ?? [],
      error: null,
    })),
  }));
  const select = vi.fn((columns?: string, selectOptions?: { count?: "exact"; head?: boolean }) => {
    if (selectOptions?.head) {
      return {
        eq: vi.fn(async () => ({
          count: options?.adminCount ?? appUsers.filter((record) => record.role === "admin").length,
          error: null,
        })),
      };
    }

    if (columns?.includes("old_role")) {
      return {
        order,
        data: options?.auditEntries ?? [],
        error: null,
      };
    }

    return {
      data: appUsers,
      error: null,
      eq: vi.fn((_column: string, value: string) => ({
        maybeSingle: vi.fn(async () => ({
          data: appUsersById.get(value) ?? null,
          error: null,
        })),
      })),
      order: vi.fn(async () => ({
        data: appUsers,
        error: null,
      })),
    };
  });
  const upsert = vi.fn(async () => ({
    data: null,
    error: options?.upsertError ?? null,
  }));
  const from = vi.fn((table: string) => {
    switch (table) {
      case "app_users":
        return {
          insert,
          select,
          update,
          upsert,
        };
      case "app_user_role_changes":
        return {
          insert,
          select,
        };
      default:
        return {
          select,
          upsert,
        };
    }
  });

  return {
    auth: {
      admin: {
        deleteUser,
        getUserById,
        updateUserById,
      },
    },
    from,
    insert,
    update,
    updateEq,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("provisionStaffUser", () => {
  it("upserts the app user before syncing auth role metadata", async () => {
    const calls: string[] = [];
    const ensureAuthUser = vi.fn(async () => {
      calls.push("ensure-auth");
    });
    const upsertAppUser = vi.fn(async () => {
      calls.push("upsert");
    });
    const updateAuthRoleMetadata = vi.fn(async () => {
      calls.push("metadata");
    });
    const deleteAuthUser = vi.fn(async () => {
      calls.push("delete");
    });

    await provisionStaffUser(
        {
          email: "staff@example.com",
          fullName: "Staff User",
          userId: "user-1",
        },
        {},
        {
          deleteAuthUser,
          ensureAuthUser,
          updateAuthRoleMetadata,
          upsertAppUser,
        },
      );

    expect(calls).toEqual(["ensure-auth", "upsert", "metadata"]);
    expect(upsertAppUser).toHaveBeenCalledWith({
      email: "staff@example.com",
      fullName: "Staff User",
      role: "editor",
      userId: "user-1",
    });
    expect(ensureAuthUser).toHaveBeenCalledWith({
      email: "staff@example.com",
      fullName: "Staff User",
      role: "editor",
      userId: "user-1",
    });
    expect(updateAuthRoleMetadata).toHaveBeenCalledWith("user-1", "editor");
    expect(deleteAuthUser).not.toHaveBeenCalled();
  });

  it("rolls back the auth user when provisioning fails during sign-up", async () => {
    const ensureAuthUser = vi.fn(async () => {});
    const upsertAppUser = vi.fn(async () => {});
    const updateAuthRoleMetadata = vi.fn(async () => {
      throw new Error("metadata failed");
    });
    const deleteAuthUser = vi.fn(async () => {});

    await expect(
      provisionStaffUser(
        {
          email: "staff@example.com",
          userId: "user-2",
        },
        { cleanupAuthUserOnFailure: true },
        {
          deleteAuthUser,
          ensureAuthUser,
          updateAuthRoleMetadata,
          upsertAppUser,
        },
      ),
    ).rejects.toThrow("metadata failed");

    expect(deleteAuthUser).toHaveBeenCalledWith("user-2");
  });

  it("rolls back the auth user when the database-side auth mirror cannot be created", async () => {
    const ensureAuthUser = vi.fn(async () => {
      throw new Error("auth mirror failed");
    });
    const upsertAppUser = vi.fn(async () => {});
    const updateAuthRoleMetadata = vi.fn(async () => {});
    const deleteAuthUser = vi.fn(async () => {});

    await expect(
      provisionStaffUser(
        {
          email: "staff@example.com",
          userId: "user-3",
        },
        { cleanupAuthUserOnFailure: true },
        {
          deleteAuthUser,
          ensureAuthUser,
          updateAuthRoleMetadata,
          upsertAppUser,
        },
      ),
    ).rejects.toThrow("auth mirror failed");

    expect(upsertAppUser).not.toHaveBeenCalled();
    expect(updateAuthRoleMetadata).not.toHaveBeenCalled();
    expect(deleteAuthUser).toHaveBeenCalledWith("user-3");
  });

  it("uses the remote admin client to upsert app_users without downgrading existing roles", async () => {
    const supabaseAdminClient = buildSupabaseAdminClient({
      existingAppUser: {
        email: "admin@example.com",
        role: "admin",
        display_name: "Existing Admin",
      },
    });

    mockedCreateSupabaseAdminClient.mockReturnValue(supabaseAdminClient as never);

    await provisionStaffUser({
      email: "staff@example.com",
      fullName: "Staff User",
      userId: "user-1",
    });

    expect(supabaseAdminClient.from).toHaveBeenCalledWith("app_users");
    expect(
      supabaseAdminClient.auth.admin.updateUserById,
    ).toHaveBeenNthCalledWith(1, "user-1", {
      user_metadata: {
        full_name: "Staff User",
        name: "Staff User",
      },
    });
    expect(supabaseAdminClient.from("app_users").upsert).toHaveBeenCalledWith(
      {
        id: "user-1",
        email: "staff@example.com",
        role: "admin",
        display_name: "Staff User",
      },
      {
        onConflict: "id",
      },
    );
    expect(
      supabaseAdminClient.auth.admin.updateUserById,
    ).toHaveBeenNthCalledWith(2, "user-1", {
      app_metadata: {
        provider: "email",
        providers: ["email"],
        app_role: "editor",
        role: "editor",
      },
    });
    expect(supabaseAdminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("rolls back the auth user when the remote app-user upsert fails", async () => {
    const upsertError = new Error("upsert failed");
    const supabaseAdminClient = buildSupabaseAdminClient({
      upsertError,
    });

    mockedCreateSupabaseAdminClient.mockReturnValue(supabaseAdminClient as never);

    await expect(
      provisionStaffUser(
        {
          email: "staff@example.com",
          userId: "user-1",
        },
        { cleanupAuthUserOnFailure: true },
      ),
    ).rejects.toThrow("upsert failed");

    expect(supabaseAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
      "user-1",
    );
  });
});

describe("getStaffRoleMetadata", () => {
  it("returns the stable default staff role mapping", () => {
    expect(getStaffRoleMetadata()).toEqual({
      app_role: "editor",
      role: "editor",
    });
  });
});

describe("normalizeRequestedStaffRole", () => {
  it("accepts only the supported role tiers", () => {
    expect(normalizeRequestedStaffRole("editor")).toBe("editor");
    expect(normalizeRequestedStaffRole("operations")).toBe("operations");
    expect(normalizeRequestedStaffRole("admin")).toBe("admin");
    expect(normalizeRequestedStaffRole("owner")).toBeNull();
  });
});

describe("listStaffAccessRecords", () => {
  it("returns staff sorted by role tier and identity", async () => {
    const supabaseAdminClient = buildSupabaseAdminClient({
      appUsers: [
        {
          id: "user-2",
          email: "editor@example.com",
          role: "editor",
          display_name: "Editor User",
          created_at: "2026-04-13T00:00:00.000Z",
          updated_at: "2026-04-13T00:00:00.000Z",
        },
        {
          id: "user-1",
          email: "admin@example.com",
          role: "admin",
          display_name: "Admin User",
          created_at: "2026-04-13T00:00:00.000Z",
          updated_at: "2026-04-13T00:00:00.000Z",
        },
      ],
    });
    mockedCreateSupabaseAdminClient.mockReturnValue(supabaseAdminClient as never);

    await expect(listStaffAccessRecords()).resolves.toEqual([
      {
        createdAt: "2026-04-13T00:00:00.000Z",
        displayName: "Admin User",
        email: "admin@example.com",
        id: "user-1",
        role: "admin",
        updatedAt: "2026-04-13T00:00:00.000Z",
      },
      {
        createdAt: "2026-04-13T00:00:00.000Z",
        displayName: "Editor User",
        email: "editor@example.com",
        id: "user-2",
        role: "editor",
        updatedAt: "2026-04-13T00:00:00.000Z",
      },
    ]);
  });
});

describe("listStaffRoleChangeRecords", () => {
  it("maps recent audit entries into admin-friendly records", async () => {
    const supabaseAdminClient = buildSupabaseAdminClient({
      auditEntries: [
        {
          actor: [{ display_name: "Admin User", email: "admin@example.com" }],
          created_at: "2026-04-13T00:00:00.000Z",
          id: "change-1",
          new_role: "operations",
          note: "Roster season",
          old_role: "editor",
          subject: [{ display_name: "Editor User", email: "editor@example.com" }],
        },
      ],
    });
    mockedCreateSupabaseAdminClient.mockReturnValue(supabaseAdminClient as never);

    await expect(listStaffRoleChangeRecords(10)).resolves.toEqual([
      {
        actorDisplayName: "Admin User",
        actorEmail: "admin@example.com",
        createdAt: "2026-04-13T00:00:00.000Z",
        id: "change-1",
        newRole: "operations",
        note: "Roster season",
        oldRole: "editor",
        subjectDisplayName: "Editor User",
        subjectEmail: "editor@example.com",
      },
    ]);
  });
});

describe("updateStaffRole", () => {
  it("updates the target role and writes an audit entry", async () => {
    const supabaseAdminClient = buildSupabaseAdminClient({
      adminCount: 2,
      appUsers: [
        {
          id: "user-1",
          email: "admin@example.com",
          role: "admin",
          display_name: "Admin User",
          created_at: "2026-04-13T00:00:00.000Z",
          updated_at: "2026-04-13T00:00:00.000Z",
        },
        {
          id: "user-2",
          email: "editor@example.com",
          role: "editor",
          display_name: "Editor User",
          created_at: "2026-04-13T00:00:00.000Z",
          updated_at: "2026-04-13T00:00:00.000Z",
        },
      ],
      existingUser: {
        id: "user-2",
        email: "editor@example.com",
        app_metadata: {},
        user_metadata: {},
      },
    });
    mockedCreateSupabaseAdminClient.mockReturnValue(supabaseAdminClient as never);

    const result = await updateStaffRole({
      actingUserId: "user-1",
      nextRole: "operations",
      note: "Roster season",
      subjectUserId: "user-2",
    });

    expect(result.changed).toBe(true);
    expect(supabaseAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith("user-2", {
      app_metadata: {
        app_role: "operations",
        role: "operations",
      },
    });
    expect(supabaseAdminClient.update).toHaveBeenCalledWith({ role: "operations" });
    expect(supabaseAdminClient.insert).toHaveBeenCalledWith({
      actor_user_id: "user-1",
      subject_user_id: "user-2",
      old_role: "editor",
      new_role: "operations",
      note: "Roster season",
    });
  });

  it("blocks self-demotion", async () => {
    const supabaseAdminClient = buildSupabaseAdminClient({
      existingAppUser: {
        id: "user-1",
        email: "admin@example.com",
        role: "admin",
        display_name: "Admin User",
        created_at: "2026-04-13T00:00:00.000Z",
        updated_at: "2026-04-13T00:00:00.000Z",
      },
    });
    mockedCreateSupabaseAdminClient.mockReturnValue(supabaseAdminClient as never);

    await expect(
      updateStaffRole({
        actingUserId: "user-1",
        nextRole: "editor",
        subjectUserId: "user-1",
      }),
    ).rejects.toThrow("Use another admin account to change your own role.");
  });
});

describe("isAppUserAuthForeignKeyRace", () => {
  it("matches the transient auth.users foreign-key race", () => {
    expect(
      isAppUserAuthForeignKeyRace({
        code: "23503",
        constraint: "app_users_id_fkey",
      }),
    ).toBe(true);
  });

  it("ignores other database failures", () => {
    expect(
      isAppUserAuthForeignKeyRace({
        code: "23505",
        constraint: "app_users_email_key",
      }),
    ).toBe(false);
  });

  it("matches the postgrest foreign-key race shape returned by remote upserts", () => {
    expect(
      isAppUserAuthForeignKeyRace({
        code: "23503",
        details:
          'Key (id)=(user-1) is not present in table "users". constraint "app_users_id_fkey"',
        message:
          'insert or update on table "app_users" violates foreign key constraint "app_users_id_fkey"',
      }),
    ).toBe(true);
  });
});

describe("retryAppUserUpsert", () => {
  it("retries the auth.users foreign-key race until the insert succeeds", async () => {
    const operation = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce({
        code: "23503",
        constraint: "app_users_id_fkey",
      })
      .mockResolvedValueOnce(undefined);
    const waitForRetry = vi.fn(async () => {});

    await retryAppUserUpsert(operation, waitForRetry);

    expect(operation).toHaveBeenCalledTimes(2);
    expect(waitForRetry).toHaveBeenCalledTimes(1);
  });

  it("does not hide non-race database failures", async () => {
    const error = {
      code: "23505",
      constraint: "app_users_email_key",
    };
    const operation = vi.fn<() => Promise<void>>().mockRejectedValue(error);

    await expect(retryAppUserUpsert(operation)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
