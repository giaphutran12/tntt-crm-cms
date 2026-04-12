import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStaffSignupSharedPassword,
  hasSupabaseServiceRoleKey,
  isDatabaseConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { query } from "@/server/db";
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
        | "missing-service-role"
        | "missing-database";
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

  if (!isDatabaseConfigured()) {
    return { status: "unavailable", reason: "missing-database" };
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

  return (
    candidate?.code === "23503" && candidate.constraint === "app_users_id_fkey"
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
      await supabaseAdmin.auth.admin.deleteUser(userId);
    },
    ensureAuthUser: async ({ email, fullName, role, userId }) => {
      const existingAuthUserResult = await query<{ exists: boolean }>(
        `
          select exists (
            select 1
            from auth.users
            where id = $1
          ) as exists
        `,
        [userId],
      );

      if (existingAuthUserResult.rows[0]?.exists) {
        return;
      }

      await query(
        `
          insert into auth.users (
            id,
            email,
            aud,
            role,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            is_sso_user,
            is_anonymous
          )
          values (
            $1,
            $2,
            'authenticated',
            'authenticated',
            timezone('utc', now()),
            $3::jsonb,
            $4::jsonb,
            timezone('utc', now()),
            timezone('utc', now()),
            false,
            false
          )
          on conflict (id) do update
          set
            email = excluded.email,
            raw_app_meta_data = excluded.raw_app_meta_data,
            raw_user_meta_data = excluded.raw_user_meta_data,
            updated_at = timezone('utc', now())
        `,
        [
          userId,
          email,
          JSON.stringify(getStaffRoleMetadata(role)),
          JSON.stringify(
            fullName
              ? {
                  full_name: fullName,
                  name: fullName,
                }
              : {},
          ),
        ],
      );
    },
    updateAuthRoleMetadata: async (userId, role) => {
      const supabaseAdmin = createSupabaseAdminClient();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: getStaffRoleMetadata(role),
      });

      if (error) {
        throw error;
      }
    },
    upsertAppUser: async ({ email, fullName, role, userId }) => {
      await retryAppUserUpsert(async () => {
        await query(
          `
            insert into public.app_users (id, email, role, display_name)
            values ($1, $2, $3::public.app_role, $4)
            on conflict (id) do update
            set
              email = excluded.email,
              display_name = coalesce(excluded.display_name, public.app_users.display_name),
              role = coalesce(public.app_users.role, excluded.role),
              updated_at = timezone('utc', now())
          `,
          [userId, email, role, fullName],
        );
      });
    },
  };
}

function waitForRetryDelay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
