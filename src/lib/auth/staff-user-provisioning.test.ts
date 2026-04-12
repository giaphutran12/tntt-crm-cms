import { describe, expect, it, vi } from "vitest";
import {
  getStaffRoleMetadata,
  isAppUserAuthForeignKeyRace,
  provisionStaffUser,
  retryAppUserUpsert,
} from "./staff-user-provisioning";

describe("provisionStaffUser", () => {
  it("upserts the app user before syncing auth role metadata", async () => {
    const calls: string[] = [];
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
        updateAuthRoleMetadata,
        upsertAppUser,
      },
    );

    expect(calls).toEqual(["upsert", "metadata"]);
    expect(upsertAppUser).toHaveBeenCalledWith({
      email: "staff@example.com",
      fullName: "Staff User",
      role: "editor",
      userId: "user-1",
    });
    expect(updateAuthRoleMetadata).toHaveBeenCalledWith("user-1", "editor");
    expect(deleteAuthUser).not.toHaveBeenCalled();
  });

  it("rolls back the auth user when provisioning fails during sign-up", async () => {
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
          updateAuthRoleMetadata,
          upsertAppUser,
        },
      ),
    ).rejects.toThrow("metadata failed");

    expect(deleteAuthUser).toHaveBeenCalledWith("user-2");
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
