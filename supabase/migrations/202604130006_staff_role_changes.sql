create table if not exists public.app_user_role_changes (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.app_users (id) on delete restrict,
  subject_user_id uuid not null references public.app_users (id) on delete restrict,
  old_role public.app_role not null,
  new_role public.app_role not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint app_user_role_changes_changed_check check (old_role <> new_role)
);

create index if not exists app_user_role_changes_subject_idx
  on public.app_user_role_changes (subject_user_id, created_at desc);

create index if not exists app_user_role_changes_actor_idx
  on public.app_user_role_changes (actor_user_id, created_at desc);

comment on table public.app_user_role_changes is
  'Audit trail for staff role changes. Every promotion/demotion records actor, subject, and the old/new role values.';

revoke all on table public.app_user_role_changes from anon, authenticated;
grant select, insert on table public.app_user_role_changes to authenticated;

alter table public.app_user_role_changes enable row level security;

drop policy if exists "admins view role change audit" on public.app_user_role_changes;
create policy "admins view role change audit"
on public.app_user_role_changes
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins insert role change audit" on public.app_user_role_changes;
create policy "admins insert role change audit"
on public.app_user_role_changes
for insert
to authenticated
with check (public.is_admin());
