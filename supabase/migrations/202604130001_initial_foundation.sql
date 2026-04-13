create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type public.app_role as enum ('ht', 'operations', 'admin');
  end if;
end $$;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  role public.app_role not null default 'ht',
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_public_app_users_updated_at on public.app_users;

create trigger set_public_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_current_timestamp_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, email, role)
  values (new.id, new.email, 'ht')
  on conflict (id) do update
  set
    email = excluded.email,
    role = coalesce(public.app_users.role, 'ht'),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

insert into storage.buckets (id, name, public)
values
  ('public-media', 'public-media', true),
  ('private-registration-files', 'private-registration-files', false)
on conflict (id) do nothing;

comment on table public.app_users is
  'Application-level staff roles. Every new gated sign-up defaults to HT until elevated by an admin.';

comment on column public.app_users.role is
  'HT is the default V1 role. Operations and admin are elevated in the app database, not in Supabase Auth metadata.';
