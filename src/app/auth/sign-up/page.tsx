import { cookies } from "next/headers";
import { lockStaffSignup, unlockStaffSignup } from "./actions";
import {
  STAFF_SIGNUP_GATE_COOKIE,
  STAFF_SIGNUP_GATE_UNLOCKED_VALUE,
} from "@/lib/auth/shared-signup-gate";
import { isSupabaseConfigured } from "@/lib/env";

type SignUpPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error?: string | string[]) {
  if (error === "missing-config") {
    return "Configure STAFF_SIGNUP_SHARED_PASSWORD in the environment before using this private route.";
  }

  if (error === "invalid-password") {
    return "The shared chapter access password was incorrect.";
  }

  return null;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const gateUnlocked =
    cookieStore.get(STAFF_SIGNUP_GATE_COOKIE)?.value ===
    STAFF_SIGNUP_GATE_UNLOCKED_VALUE;
  const supabaseConfigured = isSupabaseConfigured();
  const message = getMessage(params.error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10 md:px-10">
      <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="eyebrow mb-3">Private Staff Sign Up</p>
        <h1 className="display-title text-4xl font-semibold text-[var(--forest)]">
          Access stays closed until the shared chapter password is confirmed.
        </h1>
        <p className="muted mt-4 max-w-2xl text-lg">
          This route is the intended entry point for invite-only HT onboarding. It
          models the access-password gate now, while the real Supabase sign-up UI is
          intentionally left for a follow-up ticket.
        </p>

        {message ? (
          <div className="mt-6 rounded-[1.25rem] border border-[rgba(164,61,47,0.24)] bg-[rgba(164,61,47,0.08)] p-4 text-sm text-[var(--accent-strong)]">
            {message}
          </div>
        ) : null}

        {!gateUnlocked ? (
          <form action={unlockStaffSignup} className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-[var(--foreground)]">
              Shared chapter access password
              <input
                className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--accent)]"
                name="sharedPassword"
                type="password"
                autoComplete="current-password"
                placeholder="Enter the internal chapter password"
                required
              />
            </label>
            <button
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Reveal the private sign-up flow
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-5">
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Access gate status: unlocked
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                The gate cookie is set for this browser session. Later tickets should
                swap the placeholder form below for a real Supabase email/password
                sign-up and role-aware onboarding step.
              </p>
            </div>

            <form className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Email
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--muted)]"
                  type="email"
                  placeholder="ht@example.com"
                  disabled
                />
              </label>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Password
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--muted)]"
                  type="password"
                  placeholder="••••••••••"
                  disabled
                />
              </label>
            </form>

            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">
                Supabase project configured: {supabaseConfigured ? "yes" : "not yet"}
              </p>
              <p className="mt-2">
                When connected, the final implementation should create a Supabase
                auth user and rely on the SQL trigger to provision the app-level `HT`
                role by default.
              </p>
            </div>

            <form action={lockStaffSignup}>
              <button
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                type="submit"
              >
                Reset the gate
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
