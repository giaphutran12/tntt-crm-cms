import { isSupabaseConfigured } from "@/lib/env";

export default function SignInPage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10 md:px-10">
      <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="eyebrow mb-3">Staff Sign In</p>
        <h1 className="display-title text-4xl font-semibold text-[var(--forest)]">
          Supabase Auth is the intended identity layer.
        </h1>
        <p className="muted mt-4 text-lg">
          This ticket wires the project for staff-only authentication without adding
          the real sign-in experience yet. Once the environment values are connected,
          later tickets can replace this placeholder with a proper email/password
          form and route protection.
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--line)] bg-white/75 p-5 text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">
            Supabase configured: {supabaseConfigured ? "yes" : "not yet"}
          </p>
          <p className="mt-2">
            Public sign-up stays closed. New staff accounts should only be created
            from the private sign-up route after passing the shared chapter access
            password gate.
          </p>
        </div>
      </div>
    </main>
  );
}
