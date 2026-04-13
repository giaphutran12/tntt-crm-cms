# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-04-13

### Added

- An admin-only `/admin/settings` workspace for viewing staff accounts, changing role tiers, and reviewing recent access changes.
- A durable `app_user_role_changes` audit log so promotions and demotions leave a real trail instead of disappearing into chat history.
- SQL helpers, table RLS policies, and storage policies that formalize editor, operations, and admin access boundaries across CMS, CRM, and file buckets.

### Changed

- CRM reads, CRM mutations, and roster exports now thread the authenticated user id into direct SQL access so policy-aware database sessions can enforce the same role ladder as the app shell.
- Staff provisioning now supports listing staff, syncing role changes across `app_users` and auth metadata, and guarding against unsafe self-demotion.

### Fixed

- Admin role changes no longer rely on manual database edits, which removes a major source of role drift between route guards and backend enforcement.
- Private registration files and CRM-sensitive records now have explicit policy coverage instead of depending on route secrecy alone.

## [0.1.1] - 2026-04-13

### Added

- Shared CMS upload validation rules for documents and images, including client-side feedback before the form submits.
- Regression coverage for CMS upload validation and managed-page save races.

### Changed

- CMS admin reads and writes now use the hosted Supabase client for announcements, pages, schedule items, resources, and media assets instead of depending on direct Postgres reads.
- Next.js server actions now accept larger CMS uploads so staff can submit the supported file types without hitting the default body limit.
- Local setup docs now explain the mixed hosted-Supabase plus local-Postgres workflow that keeps CMS publishing aligned with the hosted project.

### Fixed

- Announcement uploads now keep attachment persistence and cleanup behavior consistent when the record insert fails after storage succeeds.
- Managed page saves now recover cleanly when two requests race to create the same slug.
- Direct video uploads are rejected with a clear CMS message instead of failing later in the flow.
