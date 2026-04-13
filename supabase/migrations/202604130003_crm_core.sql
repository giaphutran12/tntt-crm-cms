do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'crm_macro_division'
  ) then
    create type public.crm_macro_division as enum ('au_nhi', 'thieu_nhi', 'nghia_si', 'hiep_si');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'crm_registration_status'
  ) then
    create type public.crm_registration_status as enum (
      'draft',
      'paper_form_received',
      'entered',
      'missing_information',
      'follow_up_required',
      'active',
      'inactive'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'crm_certificate_status'
  ) then
    create type public.crm_certificate_status as enum (
      'unknown',
      'missing',
      'partial',
      'complete',
      'known_student',
      'waived'
    );
  end if;
end $$;

create table if not exists public.crm_families (
  id uuid primary key default gen_random_uuid(),
  household_name text not null,
  home_address text not null default '',
  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  notes text,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_public_crm_families_updated_at on public.crm_families;

create trigger set_public_crm_families_updated_at
before update on public.crm_families
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.crm_guardians (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.crm_families (id) on delete cascade,
  full_name text not null,
  relationship_label text,
  phone text,
  email text,
  is_primary_contact boolean not null default false,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_public_crm_guardians_updated_at on public.crm_guardians;

create trigger set_public_crm_guardians_updated_at
before update on public.crm_guardians
for each row
execute function public.set_current_timestamp_updated_at();

create unique index if not exists crm_guardians_primary_contact_idx
  on public.crm_guardians (family_id)
  where is_primary_contact = true;

create index if not exists crm_guardians_family_idx
  on public.crm_guardians (family_id, sort_order asc, full_name asc);

create table if not exists public.crm_students (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.crm_families (id) on delete set null,
  legal_first_name text not null,
  legal_last_name text not null,
  preferred_name text,
  saint_name text,
  birthdate date,
  gender_value text,
  email text,
  phone text,
  health_support_notes text,
  baptism_completed boolean,
  first_communion_completed boolean,
  confirmation_completed boolean,
  notes text,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_public_crm_students_updated_at on public.crm_students;

create trigger set_public_crm_students_updated_at
before update on public.crm_students
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists crm_students_family_idx
  on public.crm_students (family_id, legal_last_name asc, legal_first_name asc);

create table if not exists public.crm_student_guardians (
  student_id uuid not null references public.crm_students (id) on delete cascade,
  guardian_id uuid not null references public.crm_guardians (id) on delete cascade,
  relationship_label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (student_id, guardian_id)
);

create index if not exists crm_student_guardians_guardian_idx
  on public.crm_student_guardians (guardian_id, student_id);

create table if not exists public.crm_registration_cycles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  school_year_label text not null unique,
  starts_on date,
  ends_on date,
  is_active boolean not null default false,
  notes text,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint crm_registration_cycles_slug_check check (slug ~ '^[a-z0-9-]+$')
);

drop trigger if exists set_public_crm_registration_cycles_updated_at on public.crm_registration_cycles;

create trigger set_public_crm_registration_cycles_updated_at
before update on public.crm_registration_cycles
for each row
execute function public.set_current_timestamp_updated_at();

create unique index if not exists crm_registration_cycles_active_idx
  on public.crm_registration_cycles ((is_active))
  where is_active = true;

create table if not exists public.crm_division_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  macro_division public.crm_macro_division not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint crm_division_levels_code_check check (code = upper(code))
);

drop trigger if exists set_public_crm_division_levels_updated_at on public.crm_division_levels;

create trigger set_public_crm_division_levels_updated_at
before update on public.crm_division_levels
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.crm_class_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  default_division_id uuid references public.crm_division_levels (id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint crm_class_groups_slug_check check (slug ~ '^[a-z0-9-]+$')
);

drop trigger if exists set_public_crm_class_groups_updated_at on public.crm_class_groups;

create trigger set_public_crm_class_groups_updated_at
before update on public.crm_class_groups
for each row
execute function public.set_current_timestamp_updated_at();

create table if not exists public.crm_student_registrations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.crm_students (id) on delete cascade,
  family_id uuid references public.crm_families (id) on delete set null,
  registration_cycle_id uuid not null references public.crm_registration_cycles (id) on delete restrict,
  division_level_id uuid references public.crm_division_levels (id) on delete set null,
  class_group_id uuid references public.crm_class_groups (id) on delete set null,
  registration_status public.crm_registration_status not null default 'draft',
  team_name text,
  intake_entered_at timestamptz,
  is_returning_student boolean,
  certificate_status public.crm_certificate_status not null default 'unknown',
  certificate_notes text,
  total_charged numeric(10, 2),
  total_paid numeric(10, 2),
  uniform_shirt_size text,
  uniform_scarf_needed boolean,
  parent_notified_status text,
  legacy_requested_programs text,
  import_notes text,
  notes text,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint crm_student_registrations_unique_student_cycle unique (student_id, registration_cycle_id),
  constraint crm_student_registrations_total_charged_check check (total_charged is null or total_charged >= 0),
  constraint crm_student_registrations_total_paid_check check (total_paid is null or total_paid >= 0)
);

drop trigger if exists set_public_crm_student_registrations_updated_at on public.crm_student_registrations;

create trigger set_public_crm_student_registrations_updated_at
before update on public.crm_student_registrations
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists crm_student_registrations_cycle_idx
  on public.crm_student_registrations (registration_cycle_id, registration_status, student_id);

create index if not exists crm_student_registrations_division_idx
  on public.crm_student_registrations (division_level_id, class_group_id, team_name);

create table if not exists public.crm_registration_attachments (
  id uuid primary key default gen_random_uuid(),
  student_registration_id uuid not null references public.crm_student_registrations (id) on delete cascade,
  label text not null,
  attachment_url text,
  storage_bucket text,
  storage_path text,
  notes text,
  created_by uuid references public.app_users (id) on delete set null,
  updated_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint crm_registration_attachments_ref_check check (
    attachment_url is not null
    or storage_path is not null
    or notes is not null
  )
);

drop trigger if exists set_public_crm_registration_attachments_updated_at on public.crm_registration_attachments;

create trigger set_public_crm_registration_attachments_updated_at
before update on public.crm_registration_attachments
for each row
execute function public.set_current_timestamp_updated_at();

create index if not exists crm_registration_attachments_registration_idx
  on public.crm_registration_attachments (student_registration_id, created_at asc);

insert into public.crm_registration_cycles (
  slug,
  name,
  school_year_label,
  starts_on,
  ends_on,
  is_active
)
values (
  '2025-2026',
  '2025-2026 Registration',
  '2025-2026',
  date '2025-09-01',
  date '2026-08-31',
  true
)
on conflict (school_year_label) do update
set
  name = excluded.name,
  slug = excluded.slug,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on;

update public.crm_registration_cycles
set is_active = (school_year_label = '2025-2026');

insert into public.crm_division_levels (
  code,
  label,
  macro_division,
  sort_order
)
values
  ('AN1', 'Au Nhi 1', 'au_nhi', 10),
  ('AN2', 'Au Nhi 2', 'au_nhi', 20),
  ('AN3', 'Au Nhi 3', 'au_nhi', 30),
  ('TN1', 'Thieu Nhi 1', 'thieu_nhi', 40),
  ('TN2', 'Thieu Nhi 2', 'thieu_nhi', 50),
  ('TN3', 'Thieu Nhi 3', 'thieu_nhi', 60),
  ('NS1', 'Nghia Si 1', 'nghia_si', 70),
  ('NS2', 'Nghia Si 2', 'nghia_si', 80),
  ('NS3', 'Nghia Si 3', 'nghia_si', 90),
  ('HS', 'Hiep Si', 'hiep_si', 100),
  ('HSTT', 'Hiep Si Truong Thanh', 'hiep_si', 110)
on conflict (code) do update
set
  label = excluded.label,
  macro_division = excluded.macro_division,
  sort_order = excluded.sort_order;

insert into public.crm_class_groups (
  slug,
  name,
  default_division_id,
  sort_order
)
values
  (
    'vo-long',
    'Vỡ Lòng',
    (select id from public.crm_division_levels where code = 'AN1'),
    10
  ),
  (
    'ruoc-le-lan-dau',
    'Rước Lễ Lần Đầu',
    (select id from public.crm_division_levels where code = 'AN2'),
    20
  ),
  (
    'giao-ly-4',
    'Giáo Lý 4',
    (select id from public.crm_division_levels where code = 'AN3'),
    30
  ),
  (
    'giao-ly-5',
    'Giáo Lý 5',
    (select id from public.crm_division_levels where code = 'TN1'),
    40
  ),
  (
    'du-bi-them-suc',
    'Dự Bị Thêm Sức',
    (select id from public.crm_division_levels where code = 'TN2'),
    50
  ),
  (
    'them-suc',
    'Thêm Sức',
    (select id from public.crm_division_levels where code = 'TN3'),
    60
  ),
  (
    'nghia-si-i',
    'Nghĩa Sĩ I',
    (select id from public.crm_division_levels where code = 'NS1'),
    70
  ),
  (
    'nghia-si-ii-iii',
    'Nghĩa Sĩ II/III',
    (select id from public.crm_division_levels where code = 'NS2'),
    80
  ),
  (
    'hiep-si',
    'Hiệp Sĩ',
    (select id from public.crm_division_levels where code = 'HS'),
    90
  ),
  (
    'hiep-si-truong-thanh',
    'Hiệp Sĩ Trưởng Thành',
    (select id from public.crm_division_levels where code = 'HSTT'),
    100
  )
on conflict (slug) do update
set
  name = excluded.name,
  default_division_id = excluded.default_division_id,
  sort_order = excluded.sort_order;

comment on table public.crm_families is
  'Household-level records for address, emergency contact, and shared guardian context.';

comment on table public.crm_guardians is
  'Guardian contact records that belong to a family household and can be linked to one or more students.';

comment on table public.crm_students is
  'Student profile records that stay distinct from yearly registration/enrollment history.';

comment on table public.crm_student_guardians is
  'Explicit student-to-guardian links so siblings can share guardians without flattening contact data onto the student row.';

comment on table public.crm_registration_cycles is
  'Yearly registration windows used to keep roster and registration history separate across school years.';

comment on table public.crm_division_levels is
  'Operational TNTT division codes such as AN1, TN3, or HSTT. These stay separate from class labels.';

comment on table public.crm_class_groups is
  'Class or homeroom groupings such as Vỡ Lòng or Thêm Sức. The default division mapping is only a suggestion, not a hard rule.';

comment on table public.crm_student_registrations is
  'Yearly registration records holding roster placement, status, payment, uniform, certificate, and intake-follow-up fields.';

comment on table public.crm_registration_attachments is
  'Private registration artifact references for scanned forms, certificates, or legacy file links.';
