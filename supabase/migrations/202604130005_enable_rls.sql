create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select app_user.role
  from public.app_users app_user
  where app_user.id = auth.uid()
  limit 1;
$$;

grant execute on function public.current_app_role() to anon, authenticated;

create or replace function public.has_minimum_app_role(required_role public.app_role)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resolved_role public.app_role;
begin
  resolved_role := public.current_app_role();

  if resolved_role is null then
    return false;
  end if;

  return case required_role
    when 'editor' then resolved_role in ('editor', 'operations', 'admin')
    when 'operations' then resolved_role in ('operations', 'admin')
    when 'admin' then resolved_role = 'admin'
    else false
  end;
end;
$$;

grant execute on function public.has_minimum_app_role(public.app_role) to anon, authenticated;

create or replace function public.is_editor_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_minimum_app_role('editor');
$$;

grant execute on function public.is_editor_or_above() to anon, authenticated;

create or replace function public.is_operations_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_minimum_app_role('operations');
$$;

grant execute on function public.is_operations_or_above() to anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_minimum_app_role('admin');
$$;

grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.is_public_cms_media_asset(asset_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cms_announcements announcement
    where announcement.attachment_media_id = asset_id
      and announcement.status = 'published'
  ) or exists (
    select 1
    from public.cms_resources resource
    where resource.file_media_id = asset_id
      and resource.status = 'published'
  );
$$;

grant execute on function public.is_public_cms_media_asset(uuid) to anon, authenticated;

revoke all on table
  public.app_users,
  public.cms_media_assets,
  public.cms_pages,
  public.cms_announcements,
  public.cms_schedule_items,
  public.cms_resources,
  public.crm_families,
  public.crm_guardians,
  public.crm_students,
  public.crm_student_guardians,
  public.crm_registration_cycles,
  public.crm_division_levels,
  public.crm_class_groups,
  public.crm_student_registrations,
  public.crm_registration_attachments
from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on table
  public.cms_media_assets,
  public.cms_pages,
  public.cms_announcements,
  public.cms_schedule_items,
  public.cms_resources
to anon;

grant select, insert, update, delete on table
  public.app_users,
  public.cms_media_assets,
  public.cms_pages,
  public.cms_announcements,
  public.cms_schedule_items,
  public.cms_resources,
  public.crm_families,
  public.crm_guardians,
  public.crm_students,
  public.crm_student_guardians,
  public.crm_registration_cycles,
  public.crm_division_levels,
  public.crm_class_groups,
  public.crm_student_registrations,
  public.crm_registration_attachments
to authenticated;

alter table public.app_users enable row level security;
alter table public.cms_media_assets enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_announcements enable row level security;
alter table public.cms_schedule_items enable row level security;
alter table public.cms_resources enable row level security;
alter table public.crm_families enable row level security;
alter table public.crm_guardians enable row level security;
alter table public.crm_students enable row level security;
alter table public.crm_student_guardians enable row level security;
alter table public.crm_registration_cycles enable row level security;
alter table public.crm_division_levels enable row level security;
alter table public.crm_class_groups enable row level security;
alter table public.crm_student_registrations enable row level security;
alter table public.crm_registration_attachments enable row level security;

drop policy if exists "app users read own row" on public.app_users;
create policy "app users read own row"
on public.app_users
for select
to authenticated
using (id = auth.uid());

drop policy if exists "admins manage app users" on public.app_users;
create policy "admins manage app users"
on public.app_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public reads published cms media assets" on public.cms_media_assets;
create policy "public reads published cms media assets"
on public.cms_media_assets
for select
to anon, authenticated
using (public.is_public_cms_media_asset(id));

drop policy if exists "editors manage cms media assets" on public.cms_media_assets;
create policy "editors manage cms media assets"
on public.cms_media_assets
for all
to authenticated
using (public.is_editor_or_above())
with check (public.is_editor_or_above());

drop policy if exists "public reads published cms pages" on public.cms_pages;
create policy "public reads published cms pages"
on public.cms_pages
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "editors manage cms pages" on public.cms_pages;
create policy "editors manage cms pages"
on public.cms_pages
for all
to authenticated
using (public.is_editor_or_above())
with check (public.is_editor_or_above());

drop policy if exists "public reads published cms announcements" on public.cms_announcements;
create policy "public reads published cms announcements"
on public.cms_announcements
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "editors manage cms announcements" on public.cms_announcements;
create policy "editors manage cms announcements"
on public.cms_announcements
for all
to authenticated
using (public.is_editor_or_above())
with check (public.is_editor_or_above());

drop policy if exists "public reads published cms schedule items" on public.cms_schedule_items;
create policy "public reads published cms schedule items"
on public.cms_schedule_items
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "editors manage cms schedule items" on public.cms_schedule_items;
create policy "editors manage cms schedule items"
on public.cms_schedule_items
for all
to authenticated
using (public.is_editor_or_above())
with check (public.is_editor_or_above());

drop policy if exists "public reads published cms resources" on public.cms_resources;
create policy "public reads published cms resources"
on public.cms_resources
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "editors manage cms resources" on public.cms_resources;
create policy "editors manage cms resources"
on public.cms_resources
for all
to authenticated
using (public.is_editor_or_above())
with check (public.is_editor_or_above());

drop policy if exists "operations manage crm families" on public.crm_families;
create policy "operations manage crm families"
on public.crm_families
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "operations manage crm guardians" on public.crm_guardians;
create policy "operations manage crm guardians"
on public.crm_guardians
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "operations manage crm students" on public.crm_students;
create policy "operations manage crm students"
on public.crm_students
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "operations manage crm student guardians" on public.crm_student_guardians;
create policy "operations manage crm student guardians"
on public.crm_student_guardians
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "operations manage crm registration cycles" on public.crm_registration_cycles;
create policy "operations manage crm registration cycles"
on public.crm_registration_cycles
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "operations manage crm division levels" on public.crm_division_levels;
create policy "operations manage crm division levels"
on public.crm_division_levels
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "operations manage crm class groups" on public.crm_class_groups;
create policy "operations manage crm class groups"
on public.crm_class_groups
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "operations manage crm student registrations" on public.crm_student_registrations;
create policy "operations manage crm student registrations"
on public.crm_student_registrations
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "operations manage crm registration attachments" on public.crm_registration_attachments;
create policy "operations manage crm registration attachments"
on public.crm_registration_attachments
for all
to authenticated
using (public.is_operations_or_above())
with check (public.is_operations_or_above());

drop policy if exists "public reads public media objects" on storage.objects;
create policy "public reads public media objects"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'public-media');

drop policy if exists "editors manage public media objects" on storage.objects;
create policy "editors manage public media objects"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'public-media'
  and public.is_editor_or_above()
)
with check (
  bucket_id = 'public-media'
  and public.is_editor_or_above()
);

drop policy if exists "operations manage private registration files" on storage.objects;
create policy "operations manage private registration files"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'private-registration-files'
  and public.is_operations_or_above()
)
with check (
  bucket_id = 'private-registration-files'
  and public.is_operations_or_above()
);
