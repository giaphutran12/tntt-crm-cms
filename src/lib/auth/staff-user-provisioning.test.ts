import { describe, expect, it, vi } from "vitest";
import {
  getStaffRoleMetadata,
  provisionStaffUser,
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
