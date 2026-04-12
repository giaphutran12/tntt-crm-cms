export default function Home() {
  return (
    <main className="grain flex min-h-screen flex-col">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 md:px-10">
        <header className="mb-10 flex flex-col gap-6 rounded-[2rem] border border-[var(--line)] bg-[rgba(255,250,244,0.72)] px-6 py-5 shadow-[0_16px_50px_rgba(31,44,55,0.08)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow mb-2">Foundation Scaffold</p>
            <h1 className="display-title text-4xl font-semibold tracking-tight text-[var(--forest)] md:text-5xl">
              TNTT Surrey CRM/CMS
            </h1>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-semibold text-[var(--muted)]">
            <a
              className="rounded-full border border-[var(--line)] px-4 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href="/auth/sign-in"
            >
              Staff sign in
            </a>
            <a
              className="rounded-full border border-[var(--line)] px-4 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href="/auth/sign-up"
            >
              Private sign up
            </a>
            <a
              className="rounded-full border border-[var(--line)] px-4 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href="/admin"
            >
              Admin shell
            </a>
          </nav>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <article className="panel rounded-[2rem] px-6 py-8 md:px-8">
            <p className="eyebrow mb-3">What exists now</p>
            <h2 className="display-title max-w-3xl text-4xl font-semibold leading-tight text-[var(--forest)]">
              The product foundation is in place without prematurely building the
              public site, CMS, or CRM features.
            </h2>
            <p className="muted mt-5 max-w-2xl text-lg">
              This starter locks in the architecture choices from ticketed planning:
              one Next.js app, Supabase-backed Postgres/Auth/Storage, checked-in SQL
              migrations, and server-side data access with no ORM.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5">
                <p className="eyebrow mb-2">Public</p>
                <p className="text-sm text-[var(--muted)]">
                  Home route is live as a landing shell. Real editorial content and
                  page models come in later tickets.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5">
                <p className="eyebrow mb-2">CMS</p>
                <p className="text-sm text-[var(--muted)]">
                  `/admin` exists as a protected-surface placeholder. Publishing
                  workflows are intentionally deferred.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/70 p-5">
                <p className="eyebrow mb-2">CRM</p>
                <p className="text-sm text-[var(--muted)]">
                  Database and auth bootstrap is ready for later roster and
                  registration features without committing to an ORM.
                </p>
              </div>
            </div>
          </article>

          <aside className="panel rounded-[2rem] px-6 py-8">
            <p className="eyebrow mb-3">Boundaries</p>
            <ul className="space-y-4 text-sm text-[var(--muted)]">
              <li className="rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4">
                No public sign-up route for parents or volunteers.
              </li>
              <li className="rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4">
                Staff sign-up is scaffolded behind a shared access-password gate.
              </li>
              <li className="rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4">
                CRM reads and writes are intended to stay server-side.
              </li>
              <li className="rounded-[1.25rem] border border-[var(--line)] bg-white/70 p-4">
                Public and private storage buckets are provisioned separately in the
                checked-in migration.
              </li>
            </ul>
          </aside>
        </section>
      </section>
    </main>
  );
}
