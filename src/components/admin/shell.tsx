import Link from "next/link";
import { ADMIN_GROUP_LABELS, getVisibleAdminSections } from "@/lib/admin/navigation";
import type { AppUser } from "@/lib/auth/session";

type AdminShellProps = {
  children: React.ReactNode;
  user: AppUser;
};

const GROUP_ORDER = ["overview", "content", "crm", "admin"] as const;

export function AdminShell({ children, user }: AdminShellProps) {
  const visibleSections = getVisibleAdminSections(user.role);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <header className="panel rounded-[2rem] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Internal Admin</p>
            <div>
              <h1 className="display-title text-3xl font-semibold text-[var(--forest)] md:text-4xl">
                Authenticated staff workspace
              </h1>
              <p className="muted mt-2 max-w-3xl text-sm md:text-base">
                Public content and CRM-sensitive student data now share one shell,
                but they do not share the same permissions.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 px-4 py-4 text-sm">
            <p className="font-semibold text-[var(--foreground)]">
              {user.name ?? user.email ?? "Signed-in staff"}
            </p>
            <p className="mt-1 text-[var(--muted)]">{user.email ?? "No email available"}</p>
            <p className="mt-3 inline-flex rounded-full bg-[rgba(32,68,58,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
              {user.roleLabel}
            </p>
            <p className="mt-2 max-w-xs text-xs text-[var(--muted)]">{user.roleDescription}</p>
            <form action="/auth/sign-out" className="mt-4" method="post">
              <button
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="panel rounded-[2rem] px-4 py-4 md:px-5">
          <div className="space-y-5">
            {GROUP_ORDER.map((group) => {
              const sections = visibleSections.filter((section) => section.group === group);

              if (sections.length === 0) {
                return null;
              }

              return (
                <div key={group}>
                  <p className="eyebrow mb-3">{ADMIN_GROUP_LABELS[group]}</p>
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <Link
                        key={section.href}
                        className="block rounded-[1.25rem] border border-[var(--line)] bg-white/70 px-4 py-3 transition hover:border-[rgba(164,61,47,0.38)] hover:bg-white"
                        href={section.href}
                      >
                        <p className="font-semibold text-[var(--forest)]">{section.label}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {section.description}
                        </p>
                      </Link>
                    ))}
                  </nav>
                </div>
              );
            })}
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
