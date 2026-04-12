import Link from "next/link";
import { getRoleLabel, type AppRole } from "@/lib/auth/roles";

type AuthUnavailablePanelProps = {
  nextPath?: string;
};

export function AuthUnavailablePanel({ nextPath = "/admin" }: AuthUnavailablePanelProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10 md:px-10">
      <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="eyebrow mb-3">Admin Locked</p>
        <h1 className="display-title text-4xl font-semibold text-[var(--forest)]">
          Supabase Auth is required before internal routes can open.
        </h1>
        <p className="muted mt-4 max-w-2xl text-lg">
          The admin shell, role guards, and signed-in redirects are wired, but this
          environment does not have Supabase configured yet. Once the auth
          environment values are present, signed-out users will be sent to staff
          sign-in and signed-in users will land back here.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="button-primary" href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}>
            Open staff sign-in
          </Link>
          <Link className="button-secondary" href="/">
            Back to public site
          </Link>
        </div>
      </div>
    </main>
  );
}

type AccessDeniedPanelProps = {
  currentRoleLabel: string;
  minimumRole: AppRole;
  sectionLabel: string;
};

export function AccessDeniedPanel({
  currentRoleLabel,
  minimumRole,
  sectionLabel,
}: AccessDeniedPanelProps) {
  return (
    <section className="panel rounded-[2rem] px-6 py-8 md:px-8">
      <p className="eyebrow mb-3">Restricted Area</p>
      <h2 className="display-title text-3xl font-semibold text-[var(--forest)]">
        {sectionLabel} requires {getRoleLabel(minimumRole)} access.
      </h2>
      <p className="muted mt-4 max-w-2xl text-base">
        You are signed in as {currentRoleLabel}. Content permissions and CRM
        permissions are intentionally separate, so this area stays unavailable
        until your account is elevated.
      </p>

      <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/75 p-5 text-sm text-[var(--muted)]">
        <p className="font-semibold text-[var(--foreground)]">Current role: {currentRoleLabel}</p>
        <p className="mt-2">Required role: {getRoleLabel(minimumRole)}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="button-primary" href="/admin">
          Return to dashboard
        </Link>
        <Link className="button-secondary" href="/admin/announcements">
          Open content workspace
        </Link>
      </div>
    </section>
  );
}
