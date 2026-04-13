import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStaffSignupSharedPassword,
  hasSupabaseServiceRoleKey,
  isSupabaseConfigured,
} from "@/lib/env";
import {
  APP_ROLES,
  DEFAULT_APP_ROLE,
  hasMinimumRole,
  type AppRole,
} from "./roles";

const APP_USER_UPSERT_MAX_ATTEMPTS = 5;
const APP_USER_UPSERT_RETRY_DELAY_MS = 75;

export type StaffSignupAvailability =
  | {
      status: "available";
    }
  | {
      reason:
        | "missing-shared-password"
        | "missing-supabase-config"
        | "missing-service-role";
      status: "unavailable";
    };

export type StaffUserProvisioningInput = {
  email: string | null;
  fullName?: string | null;
  role?: AppRole;
  userId: string;
};

type StaffUserProvisioningDependencies = {
  deleteAuthUser: (userId: string) => Promise<void>;
  ensureAuthUser: (input: Required<StaffUserProvisioningInput>) => Promise<void>;
  updateAuthRoleMetadata: (userId: string, role: AppRole) => Promise<void>;
  upsertAppUser: (input: Required<StaffUserProvisioningInput>) => Promise<void>;
};

type StaffUserProvisioningOptions = {
  cleanupAuthUserOnFailure?: boolean;
};

type PgErrorLike = {
  code?: string;
  constraint?: string;
  details?: string | null;
  message?: string;
};

type AppUserRecord = {
  created_at?: string;
  display_name: string | null;
  email: string | null;
  role: AppRole;
  updated_at?: string;
};

type RoleChangeAuditRecord = {
  actor: Array<{
    display_name: string | null;
    email: string | null;
  }> | null;
  created_at: string;
  id: string;
  new_role: AppRole;
  note: string | null;
  old_role: AppRole;
  subject: Array<{
    display_name: string | null;
    email: string | null;
  }> | null;
};

export type StaffAccessRecord = {
  createdAt: string;
  displayName: string | null;
  email: string | null;
  id: string;
  role: AppRole;
  updatedAt: string;
};

export type StaffRoleChangeRecord = {
  actorDisplayName: string | null;
  actorEmail: string | null;
  createdAt: string;
  id: string;
  newRole: AppRole;
  note: string | null;
  oldRole: AppRole;
  subjectDisplayName: string | null;
  subjectEmail: string | null;
};

export function getStaffSignupAvailability(): StaffSignupAvailability {
  if (!isSupabaseConfigured()) {
    return { status: "unavailable", reason: "missing-supabase-config" };
  }

  if (!getStaffSignupSharedPassword()) {
    return { status: "unavailable", reason: "missing-shared-password" };
  }

  if (!hasSupabaseServiceRoleKey()) {
    return { status: "unavailable", reason: "missing-service-role" };
  }

  return { status: "available" };
}

export function getStaffRoleMetadata(role: AppRole = DEFAULT_APP_ROLE) {
  return {
    app_role: role,
    role,
  };
}

export function normalizeRequestedStaffRole(input?: string | null) {
  if (!input) {
    return null;
  }

  return APP_ROLES.find((role) => role === input) ?? null;
}

export function isAppUserAuthForeignKeyRace(error: unknown) {
  const candidate = error as PgErrorLike | null;
  const message = `${candidate?.message ?? ""} ${candidate?.details ?? ""}`;

  return (
    candidate?.code === "23503" &&
    (candidate.constraint === "app_users_id_fkey" ||
      message.includes("app_users_id_fkey"))
  );
}

export async function retryAppUserUpsert(
  operation: () => Promise<void>,
  waitForRetry: (milliseconds: number) => Promise<void> = waitForRetryDelay,
) {
  for (let attempt = 1; attempt <= APP_USER_UPSERT_MAX_ATTEMPTS; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      if (
        !isAppUserAuthForeignKeyRace(error) ||
        attempt === APP_USER_UPSERT_MAX_ATTEMPTS
      ) {
        throw error;
      }

      await waitForRetry(APP_USER_UPSERT_RETRY_DELAY_MS * attempt);
    }
  }
}

export async function provisionStaffUser(
  input: StaffUserProvisioningInput,
  options: StaffUserProvisioningOptions = {},
  dependencies: StaffUserProvisioningDependencies = createDefaultDependencies(),
) {
  const normalizedInput = {
    email: input.email,
    fullName: input.fullName ?? null,
    role: input.role ?? DEFAULT_APP_ROLE,
    userId: input.userId,
  };

  try {
    await dependencies.ensureAuthUser(normalizedInput);
    await dependencies.upsertAppUser(normalizedInput);
    await dependencies.updateAuthRoleMetadata(
      normalizedInput.userId,
      normalizedInput.role,
    );
  } catch (error) {
    if (options.cleanupAuthUserOnFailure) {
      try {
        await dependencies.deleteAuthUser(normalizedInput.userId);
      } catch {
        // Best-effort cleanup after a partially-created auth account.
      }
    }

    throw error;
  }
}

export async function listStaffAccessRecords() {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id,email,role,display_name,created_at,updated_at");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => mapStaffAccessRecord(row as AppUserRecord & { id: string }))
    .sort((left, right) => {
      if (left.role === right.role) {
        return (left.email ?? left.displayName ?? left.id).localeCompare(
          right.email ?? right.displayName ?? right.id,
        );
      }

      return hasMinimumRole(left.role, right.role) ? -1 : 1;
    });
}

export async function listStaffRoleChangeRecords(limit = 20) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("app_user_role_changes")
    .select(`
      id,
      old_role,
      new_role,
      note,
      created_at,
      actor:actor_user_id (
        email,
        display_name
      ),
      subject:subject_user_id (
        email,
        display_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) =>
    mapRoleChangeAuditRecord(row as RoleChangeAuditRecord),
  );
}

export async function updateStaffRole(input: {
  actingUserId: string;
  nextRole: AppRole;
  note?: string | null;
  subjectUserId: string;
}) {
  const supabaseAdmin = createSupabaseAdminClient();
  const actingUser = await loadRequiredAppUser(supabaseAdmin, input.actingUserId);
  const subjectUser = await loadRequiredAppUser(supabaseAdmin, input.subjectUserId);

  if (actingUser.role !== "admin") {
    throw new Error("Only admins can change staff roles.");
  }

  if (actingUser.id === subjectUser.id) {
    throw new Error("Use another admin account to change your own role.");
  }

  if (subjectUser.role === input.nextRole) {
    return {
      changed: false as const,
      record: mapStaffAccessRecord(subjectUser),
    };
  }

  if (subjectUser.role === "admin" && input.nextRole !== "admin") {
    const adminCount = await countAdminUsers(supabaseAdmin);

    if (adminCount <= 1) {
      throw new Error("At least one admin account must remain.");
    }
  }

  const existingUserResult = await supabaseAdmin.auth.admin.getUserById(input.subjectUserId);

  if (existingUserResult.error) {
    throw existingUserResult.error;
  }

  if (!existingUserResult.data.user) {
    throw new Error(`Auth user ${input.subjectUserId} could not be loaded for role sync.`);
  }

  await syncAuthRoleMetadata(
    supabaseAdmin,
    input.subjectUserId,
    input.nextRole,
    existingUserResult.data.user.app_metadata,
  );

  try {
    const { data: updatedAppUser, error: updateError } = await supabaseAdmin
      .from("app_users")
      .update({
        role: input.nextRole,
      })
      .eq("id", input.subjectUserId)
      .select("id,email,role,display_name,created_at,updated_at")
      .single();

    if (updateError) {
      throw updateError;
    }

    const { error: auditError } = await supabaseAdmin
      .from("app_user_role_changes")
      .insert({
        actor_user_id: input.actingUserId,
        subject_user_id: input.subjectUserId,
        old_role: subjectUser.role,
        new_role: input.nextRole,
        note: input.note?.trim() || null,
      });

    if (auditError) {
      throw auditError;
    }

    return {
      changed: true as const,
      record: mapStaffAccessRecord(updatedAppUser as AppUserRecord & { id: string }),
    };
  } catch (error) {
    await syncAuthRoleMetadata(
      supabaseAdmin,
      input.subjectUserId,
      subjectUser.role,
      existingUserResult.data.user.app_metadata,
    );
    throw error;
  }
}

function createDefaultDependencies(): StaffUserProvisioningDependencies {
  return {
    deleteAuthUser: async (userId) => {
      const supabaseAdmin = createSupabaseAdminClient();
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (error) {
        throw error;
      }
    },
    ensureAuthUser: async ({ fullName, userId }) => {
      const supabaseAdmin = createSupabaseAdminClient();
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (error) {
        throw error;
      }

      if (!data.user || data.user.id !== userId) {
        throw new Error(`Auth user ${userId} could not be loaded for staff provisioning.`);
      }

      const nextUserMetadata =
        fullName &&
        data.user.user_metadata.full_name !== fullName &&
        data.user.user_metadata.name !== fullName
          ? {
              ...data.user.user_metadata,
              full_name: fullName,
              name: fullName,
            }
          : null;

      if (!nextUserMetadata) {
        return;
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: nextUserMetadata,
        },
      );

      if (updateError) {
        throw updateError;
      }
    },
    updateAuthRoleMetadata: async (userId, role) => {
      const supabaseAdmin = createSupabaseAdminClient();
      const existingUserResult = await supabaseAdmin.auth.admin.getUserById(userId);

      if (existingUserResult.error) {
        throw existingUserResult.error;
      }

      if (!existingUserResult.data.user) {
        throw new Error(`Auth user ${userId} could not be loaded for role sync.`);
      }

      await syncAuthRoleMetadata(
        supabaseAdmin,
        userId,
        role,
        existingUserResult.data.user.app_metadata,
      );
    },
    upsertAppUser: async ({ email, fullName, role, userId }) => {
      const supabaseAdmin = createSupabaseAdminClient();
      const existingAppUser = await loadExistingAppUser(supabaseAdmin, userId);

      await retryAppUserUpsert(async () => {
        const { error } = await supabaseAdmin.from("app_users").upsert(
          {
            id: userId,
            email: email ?? existingAppUser?.email ?? null,
            role: existingAppUser?.role ?? role,
            display_name: fullName ?? existingAppUser?.display_name ?? null,
          },
          {
            onConflict: "id",
          },
        );

        if (error) {
          throw error;
        }
      });
    },
  };
}

async function loadExistingAppUser(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id, email, role, display_name, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle<AppUserRecord>();

  if (error) {
    throw error;
  }

  return data;
}

async function loadRequiredAppUser(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
) {
  const appUser = await loadExistingAppUser(supabaseAdmin, userId);

  if (!appUser || !("id" in appUser) || typeof appUser.id !== "string") {
    throw new Error(`Staff account ${userId} could not be loaded.`);
  }

  return appUser as AppUserRecord & { id: string };
}

async function countAdminUsers(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { count, error } = await supabaseAdmin
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function syncAuthRoleMetadata(
  supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  role: AppRole,
  existingMetadata: Record<string, unknown>,
) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...existingMetadata,
      ...getStaffRoleMetadata(role),
    },
  });

  if (error) {
    throw error;
  }
}

function mapStaffAccessRecord(
  row: AppUserRecord & { id: string },
): StaffAccessRecord {
  return {
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(0).toISOString(),
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    role: row.role,
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : new Date(0).toISOString(),
  };
}

function mapRoleChangeAuditRecord(
  row: RoleChangeAuditRecord,
): StaffRoleChangeRecord {
  const actor = Array.isArray(row.actor) ? row.actor[0] : null;
  const subject = Array.isArray(row.subject) ? row.subject[0] : null;

  return {
    actorDisplayName: actor?.display_name ?? null,
    actorEmail: actor?.email ?? null,
    createdAt: row.created_at,
    id: row.id,
    newRole: row.new_role,
    note: row.note,
    oldRole: row.old_role,
    subjectDisplayName: subject?.display_name ?? null,
    subjectEmail: subject?.email ?? null,
  };
}

function waitForRetryDelay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
