import { notFound } from "next/navigation";
import { AccessDeniedPanel } from "@/components/admin/access-panels";
import { CmsSectionContent } from "@/components/admin/cms";
import { CrmSectionContent } from "@/components/admin/crm";
import { AdminSettingsSection } from "@/components/admin/settings";
import { getAdminSection } from "@/lib/admin/navigation";
import { requireMinimumRole } from "@/lib/auth/session";

type AdminSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSectionPage({
  params,
  searchParams,
}: AdminSectionPageProps) {
  const { section } = await params;
  const resolvedSearchParams = await searchParams;
  const adminSection = getAdminSection(section);

  if (!adminSection) {
    notFound();
  }

  const access = await requireMinimumRole(adminSection.minimumRole, adminSection.href);

  if (!access.authorized) {
    if (access.reason === "auth-unavailable") {
      notFound();
    }

    return (
      <AccessDeniedPanel
        currentRoleLabel={access.currentUser.roleLabel}
        minimumRole={adminSection.minimumRole}
        sectionLabel={adminSection.label}
      />
    );
  }

  if (adminSection.group === "content") {
    return (
      <CmsSectionContent
        searchParams={resolvedSearchParams}
        section={adminSection.slug}
      />
    );
  }

  if (adminSection.group === "crm") {
    return (
      <CrmSectionContent
        currentUserId={access.currentUser.id}
        searchParams={resolvedSearchParams}
        section={adminSection.slug}
      />
    );
  }

  if (adminSection.group === "admin") {
    return (
      <AdminSettingsSection
        currentUser={access.currentUser}
        searchParams={resolvedSearchParams}
      />
    );
  }

  return (
    <section className="panel rounded-[2rem] px-6 py-8 md:px-8">
      <p className="eyebrow mb-3">{adminSection.label}</p>
      <h2 className="display-title text-3xl font-semibold text-[var(--forest)] md:text-4xl">
        {adminSection.description}
      </h2>
      <p className="muted mt-4 max-w-3xl text-base md:text-lg">
        This route is intentionally ready before the data layer ticket lands. The
        auth shell already knows whether this area belongs to public-content
        editors, CRM operations staff, or full administrators.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5">
          <p className="eyebrow mb-2">Required role</p>
          <p className="text-lg font-semibold text-[var(--forest)]">
            {adminSection.minimumRole}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Later server actions for this area should reuse the same minimum-role
            guard before touching data.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5">
          <p className="eyebrow mb-2">Boundary</p>
          <p className="text-lg font-semibold text-[var(--forest)]">
            {adminSection.group === "overview" ? "Overview" : "Administration"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Public publishing and child-data access intentionally stay on different
            authorization paths.
          </p>
        </div>
      </div>
    </section>
  );
}
