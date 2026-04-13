# TNTT Surrey CRM/CMS

Foundational scaffold for the Doan Duc Me La Vang chapter website plus internal CMS/CRM. This repo intentionally starts with the platform pieces only: a Next.js App Router app, Supabase/Postgres wiring, checked-in SQL migrations, and the auth/storage direction for invite-only staff access.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS v4
- `pnpm` for package management
- Supabase Auth, Postgres, and Storage
- Checked-in SQL migrations with a thin server-side `pg` access layer
- No ORM

## Prerequisites

- Node.js `>=20.9.0`
- `pnpm` `10.33.0`
- Optional for local database work: Supabase CLI

If `pnpm` is not installed yet, install it with one of:

```bash
npm install --global pnpm@10.33.0
```

or

```bash
npx pnpm@10.33.0 --version
```

## Local setup

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Fill in the Supabase and Postgres values in `.env.local`.

If you are using the local Supabase CLI stack, keep the auth/storage keys and
the Postgres URL on the same local project. A mixed setup such as hosted
`NEXT_PUBLIC_SUPABASE_URL` plus local `DATABASE_URL` is now valid for the
public site, staff auth, and CMS publishing flows because CMS reads and writes
run through the hosted Supabase project. It still breaks the CRM paths that use
direct Postgres access, so keep `DATABASE_URL` aligned when you need the CRM.

The fastest local path is:

```bash
supabase start
supabase status -o env
```

Then copy `API_URL`, `PUBLISHABLE_KEY`, `SERVICE_ROLE_KEY`, and `DB_URL` into
the matching `.env.local` entries before starting Next.js.

3. Install dependencies:

```bash
pnpm install
```

4. Start the app:

```bash
pnpm dev
```

The public shell lives at `/`. Staff auth lives at `/auth/sign-in` and `/auth/sign-up`, and the admin CMS shell lives at `/admin`.

Current role tiers:

- `editor` can manage public-facing CMS content
- `operations` can manage CMS content plus CRM-sensitive family/student/registration records
- `admin` can manage content, CRM access, and staff role assignments in `/admin/settings`

## Representative demo data

Running the checked-in migrations also seeds representative local-development data for ticket validation:

- published homepage, about, contact, announcement, schedule, and resource records
- public demo attachments under [`public/demo`](./public/demo)
- sample family, guardian, student, and yearly registration records for roster/export QA

If you are using the Supabase CLI locally, `supabase db reset` is the fastest way to apply the schema plus demo dataset in one pass.

## Validation commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Database bootstrap

SQL migrations are checked in under [`supabase/migrations`](./supabase/migrations). The current migration set creates:

- app-level staff roles: `editor`, `operations`, `admin`
- `public.app_users` linked to `auth.users`
- a trigger that provisions every new auth account as `editor` by default
- row-level security helpers and policies across app tables plus storage buckets
- the `public-media` and `private-registration-files` storage buckets
- CMS tables for announcements, managed pages, schedule items, resources, and uploaded media assets
- an audit trail for staff role changes
- representative demo CMS and CRM records for local review

If you are using the Supabase CLI locally, a typical bootstrap flow is:

```bash
supabase start
supabase db reset
```

If you are pointing at a hosted project instead, push the checked-in migrations with your normal Supabase deployment flow before wiring product features.

## Auth direction

This scaffold does **not** expose public signup. The implemented V1 flow is:

1. Share a private internal sign-up URL with intended staff only.
2. Require a shared chapter access password before revealing the real sign-up form.
3. Complete Supabase email/password sign-up.
4. Provision the new account as `Editor` by default in the app database and auth metadata.
5. Promote staff to `Operations` or `Admin` from `/admin/settings` when they need CRM or access-management privileges.

Staff sign-in uses Supabase email/password, preserves safe `/admin` next-path redirects, and keeps public visitors outside the protected admin routes.
