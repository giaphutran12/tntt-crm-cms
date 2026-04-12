import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { lockStaffSignup, signUpStaff, unlockStaffSignup } from "./actions";
import { getCurrentAppUser, getSafeAuthRedirectPath } from "@/lib/auth/session";
import { getStaffSignupAvailability } from "@/lib/auth/staff-user-provisioning";
import {
  STAFF_SIGNUP_GATE_COOKIE,
  STAFF_SIGNUP_GATE_UNLOCKED_VALUE,
} from "@/lib/auth/shared-signup-gate";

type SignUpPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error?: string | string[]) {
  if (error === "missing-config") {
    return "Staff sign-up is unavailable until Supabase auth, the service role key, the database, and the shared chapter password are all configured.";
  }

  if (error === "invalid-password") {
    return "The shared chapter access password was incorrect.";
  }

  if (error === "locked") {
    return "Confirm the shared chapter access password before opening the private sign-up form.";
  }

  if (error === "missing-fields") {
    return "Enter both email and password to create the staff account.";
  }

  if (error === "email-in-use") {
    return "That email address is already registered. Sign in instead or reset the password from Supabase.";
  }

  if (error === "invalid-email") {
    return "Enter a valid email address for the new staff account.";
  }

  if (error === "weak-password") {
    return "Choose a stronger password that meets the Supabase project requirements.";
  }

  if (error === "sign-up-failed") {
    return "The staff account could not be created. Try again or check the Supabase auth settings.";
  }

  if (error === "provisioning-failed") {
    return "The auth account was created, but the app-user provisioning step failed and was rolled back.";
  }

  return null;
}

function getAvailabilityLabel(
  availability: ReturnType<typeof getStaffSignupAvailability>,
) {
  if (availability.status === "available") {
    return "ready";
  }

  if (availability.reason === "missing-shared-password") {
    return "missing shared password";
  }

  if (availability.reason === "missing-supabase-config") {
    return "missing Supabase client config";
  }

  if (availability.reason === "missing-service-role") {
    return "missing Supabase service role key";
  }

  return "missing database connection";
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath = getSafeAuthRedirectPath(
    typeof params.next === "string" ? params.next : null,
  );
  const cookieStore = await cookies();
  const currentUser = await getCurrentAppUser();
  const availability = getStaffSignupAvailability();
  const gateUnlocked =
    cookieStore.get(STAFF_SIGNUP_GATE_COOKIE)?.value ===
    STAFF_SIGNUP_GATE_UNLOCKED_VALUE;
  const message = getMessage(params.error);

  if (currentUser) {
    redirect(nextPath);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10 md:px-10">
      <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="eyebrow mb-3">Private Staff Sign Up</p>
        <h1 className="display-title text-4xl font-semibold text-[var(--forest)]">
          Access stays closed until the shared chapter password is confirmed.
        </h1>
        <p className="muted mt-4 max-w-2xl text-lg">
          This route is the private onboarding path for invite-only staff. Public
          visitors should never see an open sign-up form for the admin shell.
        </p>

        {message ? (
          <div className="mt-6 rounded-[1.25rem] border border-[rgba(164,61,47,0.24)] bg-[rgba(164,61,47,0.08)] p-4 text-sm text-[var(--accent-strong)]">
            {message}
          </div>
        ) : null}

        {!gateUnlocked ? (
          <form action={unlockStaffSignup} className="mt-8 space-y-4">
            <input name="next" type="hidden" value={nextPath} />
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
                The shared chapter password has been confirmed for this browser
                session. New staff accounts created here default to the internal
                Editor role until an admin elevates them.
              </p>
            </div>

            <form action={signUpStaff} className="grid gap-4 md:grid-cols-2">
              <input name="next" type="hidden" value={nextPath} />
              <label className="text-sm font-semibold text-[var(--foreground)] md:col-span-2">
                Full name (optional)
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--accent)]"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Huynh Truong name"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Email
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--accent)]"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="staff@example.com"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Password
                <input
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--accent)]"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  required
                />
              </label>
              <div className="md:col-span-2">
                <button
                  className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                  type="submit"
                >
                  Create the staff account
                </button>
              </div>
            </form>

            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">
                Sign-up configuration status: {getAvailabilityLabel(availability)}
              </p>
              <p className="mt-2">
                Successful sign-up provisions the matching `public.app_users` record
                and stores the default Editor role in the app authorization layer
                before any Operations or Admin elevation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="button-secondary" href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}>
                Back to staff sign-in
              </Link>
              <Link className="button-secondary" href="/">
                Back to public site
              </Link>
            </div>

            <form action={lockStaffSignup}>
              <input name="next" type="hidden" value={nextPath} />
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
