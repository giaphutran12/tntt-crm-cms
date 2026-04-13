import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStaffSignupSharedPassword,
  hasSupabaseServiceRoleKey,
  isSupabaseConfigured,
} from "@/lib/env";
import { DEFAULT_APP_ROLE, type AppRole } from "./roles";

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
  display_name: string | null;
  email: string | null;
  role: AppRole;
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

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: {
          ...existingUserResult.data.user.app_metadata,
          ...getStaffRoleMetadata(role),
        },
      });

      if (error) {
        throw error;
      }
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
    .select("email, role, display_name")
    .eq("id", userId)
    .maybeSingle<AppUserRecord>();

  if (error) {
    throw error;
  }

  return data;
}

function waitForRetryDelay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
