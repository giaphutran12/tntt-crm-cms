import Link from "next/link";
import { redirect } from "next/navigation";
import { signInStaff } from "./actions";
import { getAuthAvailability, getCurrentAppUser, getSafeAuthRedirectPath } from "@/lib/auth/session";

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getMessage(error?: string | string[]) {
  if (error === "missing-config") {
    return "Connect the Supabase environment before internal staff sign-in can succeed.";
  }

  if (error === "missing-fields") {
    return "Enter both email and password to continue.";
  }

  if (error === "invalid-credentials") {
    return "The email or password was not accepted.";
  }

  return null;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const authAvailability = await getAuthAvailability();
  const currentUser = await getCurrentAppUser();
  const params = (await searchParams) ?? {};
  const nextPath = getSafeAuthRedirectPath(
    typeof params.next === "string" ? params.next : null,
  );

  if (currentUser) {
    redirect(nextPath);
  }

  const message = getMessage(params.error);
  const registered = params.registered === "1";
  const signedOut = params.signedOut === "1";
  const supabaseConfigured = authAvailability.status === "available";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10 md:px-10">
      <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="eyebrow mb-3">Staff Sign In</p>
        <h1 className="display-title text-4xl font-semibold text-[var(--forest)]">
          Staff auth now gates the internal admin shell.
        </h1>
        <p className="muted mt-4 text-lg">
          Signed-out visitors stay on public routes. Signed-in staff return to
          `/admin`, where content access and CRM-sensitive access are guarded by
          separate app roles.
        </p>

        {signedOut ? (
          <div className="mt-6 rounded-[1.25rem] border border-[rgba(32,68,58,0.18)] bg-[rgba(32,68,58,0.08)] p-4 text-sm text-[var(--forest)]">
            You have been signed out.
          </div>
        ) : null}

        {registered ? (
          <div className="mt-6 rounded-[1.25rem] border border-[rgba(32,68,58,0.18)] bg-[rgba(32,68,58,0.08)] p-4 text-sm text-[var(--forest)]">
            The staff account is ready. Sign in to continue to the admin area.
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-[1.25rem] border border-[rgba(164,61,47,0.24)] bg-[rgba(164,61,47,0.08)] p-4 text-sm text-[var(--accent-strong)]">
            {message}
          </div>
        ) : null}

        <form action={signInStaff} className="mt-8 space-y-4">
          <input name="next" type="hidden" value={nextPath} />
          <label className="block text-sm font-semibold text-[var(--foreground)]">
            Email
            <input
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--accent)]"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="staff@example.com"
              required
              disabled={!supabaseConfigured}
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--foreground)]">
            Password
            <input
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--accent)]"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              disabled={!supabaseConfigured}
            />
          </label>
          <button
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!supabaseConfigured}
          >
            Sign in to admin
          </button>
        </form>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/75 p-5 text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">
            Supabase configured: {supabaseConfigured ? "yes" : "not yet"}
          </p>
          <p className="mt-2">
            Editor access is the default internal role. Operations and Admin are
            elevated roles for CRM-sensitive data and settings management.
          </p>
          <p className="mt-2">
            Public sign-up stays closed. New staff onboarding should still begin at
            the private sign-up gate.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="button-secondary"
            href={`/auth/sign-up?next=${encodeURIComponent(nextPath)}`}
          >
            Private sign-up gate
          </Link>
          <Link className="button-secondary" href="/">
            Back to public site
          </Link>
        </div>
      </div>
    </main>
  );
}
