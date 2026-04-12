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

3. Install dependencies:

```bash
pnpm install
```

4. Start the app:

```bash
pnpm dev
```

The public shell lives at `/`. Staff auth lives at `/auth/sign-in` and `/auth/sign-up`, and the admin CMS shell lives at `/admin`.

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
- the `public-media` and `private-registration-files` storage buckets
- CMS tables for announcements, managed pages, schedule items, resources, and uploaded media assets

If you are using the Supabase CLI locally, a typical bootstrap flow is:

```bash
supabase start
supabase db reset
```

If you are pointing at a hosted project instead, push the checked-in migrations with your normal Supabase deployment flow before wiring product features.

## Auth direction

This scaffold does **not** expose public signup. The intended V1 flow is:

1. Share a private internal sign-up URL with intended staff only.
2. Require a shared chapter access password before revealing the real sign-up form.
3. Complete Supabase email/password sign-up.
4. Provision the new account as `Editor` by default in the app database.

The current codebase includes the password-gate placeholder and the supporting env/config hooks. Real staff auth UI and authorization rules should land in later tickets.
