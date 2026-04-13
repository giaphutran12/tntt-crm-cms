import "server-only";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { query } from "@/server/db";
import {
  DEFAULT_APP_ROLE,
  getRoleDescription,
  getRoleLabel,
  hasMinimumRole,
  normalizeAppRole,
  type AppRole,
} from "./roles";

export type AuthAvailability =
  | {
      status: "unavailable";
    }
  | {
      status: "available";
    };

export type AppUser = {
  email: string | null;
  id: string;
  name: string | null;
  role: AppRole;
  roleDescription: string;
  roleLabel: string;
};

function getSafeRedirectPath(
  nextPath?: string | null,
  fallbackPath = "/admin",
) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallbackPath;
  }

  return nextPath;
}

async function getRoleFromDatabase(userId: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const result = await query<{ role: string }>(
      `
        select role::text as role
        from public.app_users
        where id = $1
        limit 1
      `,
      [userId],
      { userId },
    );

    return normalizeAppRole(result.rows[0]?.role ?? null);
  } catch {
    return null;
  }
}

function getRoleFromUser(user: User): AppRole {
  const metadataCandidates = [user.app_metadata.role, user.app_metadata.app_role];

  for (const candidate of metadataCandidates) {
    const normalizedRole = normalizeAppRole(
      typeof candidate === "string" ? candidate : null,
    );

    if (normalizedRole) {
      return normalizedRole;
    }
  }

  return DEFAULT_APP_ROLE;
}

async function toAppUser(user: User): Promise<AppUser> {
  const role = (await getRoleFromDatabase(user.id)) ?? getRoleFromUser(user);
  const name =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : null;

  return {
    email: user.email ?? null,
    id: user.id,
    name,
    role,
    roleDescription: getRoleDescription(role),
    roleLabel: getRoleLabel(role),
  };
}

export const getAuthAvailability = cache(async (): Promise<AuthAvailability> => {
  if (!isSupabaseConfigured()) {
    return { status: "unavailable" };
  }

  return { status: "available" };
});

export const getCurrentAppUser = cache(async (): Promise<AppUser | null> => {
  const authAvailability = await getAuthAvailability();

  if (authAvailability.status === "unavailable") {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return toAppUser(user);
});

export async function requireAuthenticatedAppUser(nextPath?: string) {
  const authAvailability = await getAuthAvailability();

  if (authAvailability.status === "unavailable") {
    return null;
  }

  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(getSafeRedirectPath(nextPath))}`);
  }

  return currentUser;
}

export async function requireMinimumRole(
  minimumRole: AppRole,
  nextPath?: string,
) {
  const currentUser = await requireAuthenticatedAppUser(nextPath);

  if (!currentUser) {
    return { authorized: false as const, reason: "auth-unavailable" as const };
  }

  return {
    authorized: hasMinimumRole(currentUser.role, minimumRole),
    currentUser,
    reason: hasMinimumRole(currentUser.role, minimumRole)
      ? ("ok" as const)
      : ("insufficient-role" as const),
  };
}

export function getSafeAuthRedirectPath(nextPath?: string | null) {
  return getSafeRedirectPath(nextPath);
}
