export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 md:px-10">
      <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="eyebrow mb-3">Admin Placeholder</p>
        <h1 className="display-title text-4xl font-semibold text-[var(--forest)]">
          Internal CMS and CRM routes will grow here.
        </h1>
        <p className="muted mt-4 max-w-2xl text-lg">
          This route exists to anchor the authenticated staff surface without
          pretending the product features are already built. Later tickets can layer
          in route protection, dashboards, publishing workflows, and roster tools on
          top of the current Supabase and SQL foundation.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5">
            <p className="eyebrow mb-2">Planned CMS work</p>
            <p className="text-sm text-[var(--muted)]">
              Pages, announcements, schedules, and resource management.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5">
            <p className="eyebrow mb-2">Planned CRM work</p>
            <p className="text-sm text-[var(--muted)]">
              Students, guardians, classes, registrations, exports, and role-based
              authorization.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
