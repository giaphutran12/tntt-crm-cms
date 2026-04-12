import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStaffSignupSharedPassword,
  hasSupabaseServiceRoleKey,
  isDatabaseConfigured,
  isSupabaseConfigured,
} from "@/lib/env";
import { query } from "@/server/db";
import { DEFAULT_APP_ROLE, type AppRole } from "./roles";

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
  updateAuthRoleMetadata: (userId: string, role: AppRole) => Promise<void>;
  upsertAppUser: (input: Required<StaffUserProvisioningInput>) => Promise<void>;
};

type StaffUserProvisioningOptions = {
  cleanupAuthUserOnFailure?: boolean;
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
    },
  };
}
