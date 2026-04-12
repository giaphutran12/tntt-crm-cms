import { getDashboardCapabilityCards } from "@/lib/admin/navigation";
import { requireAuthenticatedAppUser } from "@/lib/auth/session";

export default async function AdminPage() {
  const currentUser = await requireAuthenticatedAppUser("/admin");
  const capabilityCards = currentUser ? getDashboardCapabilityCards(currentUser.role) : [];

  return (
    <section className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="eyebrow mb-3">Dashboard</p>
        <h2 className="display-title text-4xl font-semibold text-[var(--forest)]">
          Signed-in access now lands inside a role-aware admin shell.
        </h2>
        <p className="muted mt-4 max-w-3xl text-lg">
          Editors can move through the publishing workspace. Operations users can
          additionally open CRM-sensitive screens. Admins keep the only path into
          permissions and site-wide settings.
        </p>

        {currentUser ? (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5 text-sm text-[var(--muted)]">
            <p className="font-semibold text-[var(--foreground)]">
              Signed in as {currentUser.roleLabel}
            </p>
            <p className="mt-2">{currentUser.roleDescription}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {capabilityCards.map((card) => (
          <div
            key={card.title}
            className="panel rounded-[1.75rem] px-5 py-6"
          >
            <p className="eyebrow mb-2">{card.requiredRole}</p>
            <h3 className="text-xl font-semibold text-[var(--forest)]">{card.title}</h3>
            <p className="mt-3 text-sm text-[var(--muted)]">{card.description}</p>
            <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
              Status: {card.enabled ? "available for your account" : "locked for your account"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
