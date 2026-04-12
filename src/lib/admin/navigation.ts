import { canAccessAdminSettings, canAccessCrm, hasMinimumRole, type AppRole } from "@/lib/auth/roles";

export type AdminSectionGroup = "overview" | "content" | "crm" | "admin";

export type AdminSection = {
  description: string;
  group: AdminSectionGroup;
  href: `/admin${string}`;
  label: string;
  minimumRole: AppRole;
  slug: string;
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    slug: "",
    href: "/admin",
    label: "Dashboard",
    description: "Role-aware overview of publishing, CRM, and staff settings boundaries.",
    minimumRole: "editor",
    group: "overview",
  },
  {
    slug: "announcements",
    href: "/admin/announcements",
    label: "Announcements",
    description: "Draft, review, and publish public ministry announcements.",
    minimumRole: "editor",
    group: "content",
  },
  {
    slug: "pages",
    href: "/admin/pages",
    label: "Pages",
    description: "Maintain the public About, Contact, and other evergreen pages.",
    minimumRole: "editor",
    group: "content",
  },
  {
    slug: "schedule",
    href: "/admin/schedule",
    label: "Schedule",
    description: "Manage chapter dates, liturgy times, and seasonal programming updates.",
    minimumRole: "editor",
    group: "content",
  },
  {
    slug: "media",
    href: "/admin/media",
    label: "Media / Files",
    description: "Organize public PDFs, downloadables, and chapter media assets.",
    minimumRole: "editor",
    group: "content",
  },
  {
    slug: "families",
    href: "/admin/families",
    label: "Families",
    description: "Work with guardian contact records and household relationships.",
    minimumRole: "operations",
    group: "crm",
  },
  {
    slug: "students",
    href: "/admin/students",
    label: "Students",
    description: "Manage student profiles, registrations, and class assignments.",
    minimumRole: "operations",
    group: "crm",
  },
  {
    slug: "divisions-classes",
    href: "/admin/divisions-classes",
    label: "Divisions / Classes",
    description: "Organize TNTT divisions, classes, and roster placement.",
    minimumRole: "operations",
    group: "crm",
  },
  {
    slug: "registration-cycles",
    href: "/admin/registration-cycles",
    label: "Registration Cycles",
    description: "Track yearly registration periods and chapter intake status.",
    minimumRole: "operations",
    group: "crm",
  },
  {
    slug: "exports",
    href: "/admin/exports",
    label: "Exports",
    description: "Produce roster and registration exports for downstream chapter workflows.",
    minimumRole: "operations",
    group: "crm",
  },
  {
    slug: "settings",
    href: "/admin/settings",
    label: "Settings",
    description: "Manage elevated staff access, role assignments, and app-level settings.",
    minimumRole: "admin",
    group: "admin",
  },
];

export const ADMIN_GROUP_LABELS: Record<AdminSectionGroup, string> = {
  overview: "Overview",
  content: "Publishing",
  crm: "Chapter Records",
  admin: "Administration",
};

export function getAdminSection(slug: string) {
  return ADMIN_SECTIONS.find((section) => section.slug === slug) ?? null;
}

export function getVisibleAdminSections(role: AppRole) {
  return ADMIN_SECTIONS.filter((section) => hasMinimumRole(role, section.minimumRole));
}

export function getDashboardCapabilityCards(role: AppRole) {
  return [
    {
      title: "Content workspace",
      requiredRole: "editor" as const,
      enabled: true,
      description:
        "Announcements, pages, schedules, and media stay available to every signed-in editor.",
    },
    {
      title: "CRM workspace",
      requiredRole: "operations" as const,
      enabled: canAccessCrm(role),
      description:
        "Student, family, class, registration, and export screens stay behind operations-grade access.",
    },
    {
      title: "Admin settings",
      requiredRole: "admin" as const,
      enabled: canAccessAdminSettings(role),
      description:
        "Role management and site-wide settings stay restricted to true administrators.",
    },
  ];
}
