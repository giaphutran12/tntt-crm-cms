import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationSource = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/202604130005_enable_rls.sql",
  ),
  "utf8",
);

const rlsTables = [
  "public.app_users",
  "public.cms_media_assets",
  "public.cms_pages",
  "public.cms_announcements",
  "public.cms_schedule_items",
  "public.cms_resources",
  "public.crm_families",
  "public.crm_guardians",
  "public.crm_students",
  "public.crm_student_guardians",
  "public.crm_registration_cycles",
  "public.crm_division_levels",
  "public.crm_class_groups",
  "public.crm_student_registrations",
  "public.crm_registration_attachments",
];

describe("RLS migration", () => {
  it("enables row level security on every application table", () => {
    for (const tableName of rlsTables) {
      expect(migrationSource).toContain(`alter table ${tableName} enable row level security;`);
    }
  });

  it("defines role helper functions for editor, operations, and admin checks", () => {
    expect(migrationSource).toContain("create or replace function public.current_app_role()");
    expect(migrationSource).toContain("create or replace function public.has_minimum_app_role");
    expect(migrationSource).toContain("create or replace function public.is_editor_or_above()");
    expect(migrationSource).toContain("create or replace function public.is_operations_or_above()");
    expect(migrationSource).toContain("create or replace function public.is_admin()");
  });

  it("protects storage buckets with separate public and private policies", () => {
    expect(migrationSource).toContain('"public reads public media objects"');
    expect(migrationSource).toContain('"editors manage public media objects"');
    expect(migrationSource).toContain('"operations manage private registration files"');
    expect(migrationSource).toContain("bucket_id = 'public-media'");
    expect(migrationSource).toContain("bucket_id = 'private-registration-files'");
  });

  it("keeps public CMS rows readable while restricting CRM tables to operations", () => {
    expect(migrationSource).toContain('"public reads published cms announcements"');
    expect(migrationSource).toContain('"public reads published cms pages"');
    expect(migrationSource).toContain('"operations manage crm families"');
    expect(migrationSource).toContain('"operations manage crm student registrations"');
  });
});
