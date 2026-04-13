do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) and exists (
    select 1
    from pg_enum
    where enumtypid = 'public.app_role'::regtype
      and enumlabel = 'ht'
  ) then
    alter type public.app_role rename value 'ht' to 'editor';
  end if;
exception
  when undefined_object then
    null;
end $$;

alter table if exists public.app_users
  alter column role set default 'editor';

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, email, role)
  values (new.id, new.email, 'editor')
  on conflict (id) do update
  set
    email = excluded.email,
    role = coalesce(public.app_users.role, 'editor'),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'cms_status'
  ) then
    create type public.cms_status as enum ('draft', 'published');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'cms_media_kind'
  ) then
    create type public.cms_media_kind as enum ('image', 'file');
  end if;
end $$;

create table if not exists public.cms_media_assets (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  kind public.cms_media_kind not null,
  bucket text not null,
  storage_path text not null unique,
  public_url text not null,
  mime_type text,
  size_bytes bigint,
  alt_text text,
  caption text,
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_public_cms_media_assets_updated_at on public.cms_media_assets;

create trigger set_public_cms_media_assets_updated_at
before update on public.cms_media_assets
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_vi text,
  summary_en text not null default '',
  summary_vi text,
  body_en text not null default '',
  body_vi text,
  status public.cms_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cms_pages_slug_check check (slug in ('home', 'about', 'contact'))
);

drop trigger if exists set_public_cms_pages_updated_at on public.cms_pages;

create trigger set_public_cms_pages_updated_at
before update on public.cms_pages
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.cms_announcements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_vi text,
  summary_en text not null default '',
  summary_vi text,
  body_en text not null default '',
  body_vi text,
  audience text,
  status public.cms_status not null default 'draft',
  is_featured boolean not null default false,
  attachment_media_id uuid references public.cms_media_assets (id) on delete set null,
  published_at timestamptz,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_public_cms_announcements_updated_at on public.cms_announcements;

create trigger set_public_cms_announcements_updated_at
before update on public.cms_announcements
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.cms_schedule_items (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_vi text,
  date_label_en text not null,
  date_label_vi text,
  note_en text not null default '',
  note_vi text,
  audience text,
  action_label text,
  action_href text,
  sort_order integer not null default 0,
  status public.cms_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_public_cms_schedule_items_updated_at on public.cms_schedule_items;

create trigger set_public_cms_schedule_items_updated_at
before update on public.cms_schedule_items
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.cms_resources (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_vi text,
  description_en text not null default '',
  description_vi text,
  audience text,
  availability_label text,
  link_url text,
  file_media_id uuid references public.cms_media_assets (id) on delete set null,
  sort_order integer not null default 0,
  status public.cms_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_public_cms_resources_updated_at on public.cms_resources;

create trigger set_public_cms_resources_updated_at
before update on public.cms_resources
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists cms_announcements_status_idx
  on public.cms_announcements (status, published_at desc);

create index if not exists cms_schedule_items_status_idx
  on public.cms_schedule_items (status, is_featured desc, sort_order asc);

create index if not exists cms_resources_status_idx
  on public.cms_resources (status, is_featured desc, sort_order asc);

comment on table public.cms_media_assets is
  'Public bucket uploads that can be attached to announcements, resource records, and future CMS features.';

comment on table public.cms_pages is
  'Editor-managed static page content for the current public routes: home, about, and contact.';

comment on table public.cms_announcements is
  'Public-facing announcement posts with optional attachments and a featured flag for the homepage.';

comment on table public.cms_schedule_items is
  'Public-facing date and schedule entries kept intentionally simple for parent readability.';

comment on table public.cms_resources is
  'Public forms, guides, and downloadable resources backed by either a file upload or an external link.';
