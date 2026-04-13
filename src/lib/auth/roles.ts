export const APP_ROLES = ["editor", "operations", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const DEFAULT_APP_ROLE: AppRole = "editor";

const LEGACY_ROLE_ALIASES = {
  ht: DEFAULT_APP_ROLE,
} as const satisfies Record<string, AppRole>;

const ROLE_LABELS: Record<AppRole, string> = {
  editor: "Editor",
  operations: "Operations",
  admin: "Admin",
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  editor: "Can manage public-facing CMS content but not family or child records.",
  operations: "Can manage public content plus CRM-sensitive chapter records.",
  admin: "Can manage content, CRM access, and staff permissions.",
};

const ROLE_ORDER: Record<AppRole, number> = {
  editor: 0,
  operations: 1,
  admin: 2,
};

export function normalizeAppRole(input?: string | null): AppRole | null {
  if (!input) {
    return null;
  }

  const normalized = input.trim().toLowerCase();

  if (normalized in LEGACY_ROLE_ALIASES) {
    return LEGACY_ROLE_ALIASES[normalized as keyof typeof LEGACY_ROLE_ALIASES];
  }

  return APP_ROLES.find((role) => role === normalized) ?? null;
}

export function getRoleLabel(role: AppRole) {
  return ROLE_LABELS[role];
}

export function getRoleDescription(role: AppRole) {
  return ROLE_DESCRIPTIONS[role];
}

export function hasMinimumRole(role: AppRole, minimumRole: AppRole) {
  return ROLE_ORDER[role] >= ROLE_ORDER[minimumRole];
}

export function canAccessContent(role: AppRole) {
  return hasMinimumRole(role, "editor");
}

export function canAccessCrm(role: AppRole) {
  return hasMinimumRole(role, "operations");
}

export function canAccessAdminSettings(role: AppRole) {
  return hasMinimumRole(role, "admin");
}
