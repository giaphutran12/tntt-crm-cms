import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStaffRoleMetadata,
  isAppUserAuthForeignKeyRace,
  provisionStaffUser,
  retryAppUserUpsert,
} from "./staff-user-provisioning";

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

const mockedCreateSupabaseAdminClient = vi.mocked(createSupabaseAdminClient);

function buildSupabaseAdminClient(options?: {
  existingAppUser?: {
    display_name: string | null;
    email: string | null;
    role: "editor" | "operations" | "admin";
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
  const maybeSingle = vi.fn(async () => ({
    data: options?.existingAppUser ?? null,
    error: null,
  }));
  const eq = vi.fn(() => ({
    maybeSingle,
  }));
  const select = vi.fn(() => ({
    eq,
  }));
  const upsert = vi.fn(async () => ({
    data: null,
    error: options?.upsertError ?? null,
  }));
  const from = vi.fn(() => ({
    select,
    upsert,
  }));

  return {
    auth: {
      admin: {
        deleteUser,
        getUserById,
        updateUserById,
      },
    },
    from,
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
    expect(supabaseAdminClient.from().upsert).toHaveBeenCalledWith(
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
