# Changelog

All notable changes to this project will be documented in this file.

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
