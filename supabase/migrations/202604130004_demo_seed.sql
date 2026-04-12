insert into public.cms_media_assets (
  id,
  label,
  kind,
  bucket,
  storage_path,
  public_url,
  mime_type,
  caption
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '2026-2027 family registration packet',
    'file',
    'public-demo',
    'public/demo/2026-2027-family-registration-packet.txt',
    '/demo/2026-2027-family-registration-packet.txt',
    'text/plain',
    'Representative local-development family registration packet.'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Lenten retreat family checklist',
    'file',
    'public-demo',
    'public/demo/lenten-retreat-family-checklist.txt',
    '/demo/lenten-retreat-family-checklist.txt',
    'text/plain',
    'Representative local-development retreat checklist.'
  )
on conflict (storage_path) do update
set
  label = excluded.label,
  kind = excluded.kind,
  bucket = excluded.bucket,
  public_url = excluded.public_url,
  mime_type = excluded.mime_type,
  caption = excluded.caption;

insert into public.cms_pages (
  id,
  slug,
  title_en,
  summary_en,
  body_en,
  status,
  published_at
)
values
  (
    '33333333-3333-4333-8333-333333333333',
    'home',
    'A family-first chapter website for announcements, schedules, and forms.',
    'This representative homepage shows how TNTT Surrey families can check the latest announcements, review upcoming dates, and reopen key documents without chasing old emails.',
    E'This seeded homepage mirrors the intended production experience: a focused public site for family-facing information and a separate authenticated admin for student records.\n\nFamilies should be able to answer the common questions quickly: what changed, what is coming up, and which form or checklist they need to reopen today.\n\nStudent rosters, guardian contacts, paper-registration artifacts, and health details stay out of the public shell entirely.',
    'published',
    timezone('utc', now())
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'about',
    'A chapter overview shaped for families who may be new to TNTT.',
    'Explain the chapter, parish context, and division-based structure in clear family-facing language without turning the public site into a private directory.',
    E'TNTT Surrey serves the Our Lady of La Vang Vietnamese community at St. Matthew''s Parish and gives families a stable public place to understand the chapter rhythm before or after registration.\n\nThe public story belongs here: what TNTT is, how the local chapter fits parish life, and how the divisions help families understand age-appropriate formation.\n\nPublic storytelling belongs here. Student rosters, guardian contacts, and yearly registration follow-up do not.',
    'published',
    timezone('utc', now())
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'contact',
    'A public contact page that keeps family guidance clear and private data separate.',
    'The contact route should give families one stable next step for public questions while keeping staff-only CRM data behind authenticated access.',
    E'A chapter-managed public inbox and a few clear routing notes reduce the need for families to guess which leader to message for schedule or paperwork questions.\n\nUntil leadership finalizes every public detail, the site should stay honest: publish what is confirmed, avoid invented contact data, and keep staff-only records in the admin workspace.\n\nThis route remains clearly public and separate from internal staff, family, and student records.',
    'published',
    timezone('utc', now())
  )
on conflict (slug) do update
set
  title_en = excluded.title_en,
  summary_en = excluded.summary_en,
  body_en = excluded.body_en,
  status = excluded.status,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());

insert into public.cms_announcements (
  id,
  slug,
  title_en,
  summary_en,
  body_en,
  audience,
  status,
  is_featured,
  attachment_media_id,
  published_at
)
values
  (
    '66666666-6666-4666-8666-666666666666',
    'registration-packet-live',
    '2026-2027 registration packet is ready',
    'Families can review the representative packet, see what paperwork is expected, and use the forms page as the canonical download location.',
    E'This seeded announcement demonstrates the publish-an-announcement workflow with a public attachment.\n\nIn production, staff would upload the approved family packet through the admin, set the post to Published, and the homepage plus archive would update automatically.',
    'Parents and guardians',
    'published',
    true,
    '11111111-1111-4111-8111-111111111111',
    timezone('utc', now()) - interval '14 days'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'lenten-retreat-checklist',
    'Lenten retreat checklist and deadline',
    'The public announcement flow supports a parent-facing post plus one attached checklist so event prep does not stay trapped in chat history.',
    E'This seeded record shows a second announcement with an attached file and a time-sensitive event deadline.\n\nIt keeps the family-facing checklist public while private student registration attachments remain inside the CRM.',
    'Registered students and families',
    'published',
    false,
    '22222222-2222-4222-8222-222222222222',
    timezone('utc', now()) - interval '7 days'
  ),
  (
    '88888888-8888-4888-8888-888888888888',
    'opening-sunday-orientation',
    'Opening Sunday family orientation',
    'A shorter reminder sits beside larger notices and still gives parents the exact arrival window, room assignment, and what to bring.',
    E'This seeded announcement is the lightweight reminder style the chapter will also need.\n\nNot every public post needs a file, but it should still be clear, scannable, and easy to find later.',
    'New families and returning households',
    'published',
    false,
    null,
    timezone('utc', now()) - interval '2 days'
  )
on conflict (slug) do update
set
  title_en = excluded.title_en,
  summary_en = excluded.summary_en,
  body_en = excluded.body_en,
  audience = excluded.audience,
  status = excluded.status,
  is_featured = excluded.is_featured,
  attachment_media_id = excluded.attachment_media_id,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());

insert into public.cms_schedule_items (
  id,
  title_en,
  date_label_en,
  note_en,
  audience,
  sort_order,
  status,
  is_featured,
  published_at
)
values
  (
    '99999999-9999-4999-8999-999999999999',
    'Sunday check-in and opening assembly',
    'Most Sundays, 8:45 AM',
    'Families can verify the arrival window, opening prayer rhythm, and where schedule changes will be announced before a full calendar product exists.',
    'Parents and guardians',
    10,
    'published',
    false,
    timezone('utc', now()) - interval '14 days'
  ),
  (
    'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'Division classes and formation blocks',
    'After assembly',
    'Use the schedule page for the stable weekly structure, then mirror any time-sensitive change in public announcements.',
    'Students and families',
    20,
    'published',
    false,
    timezone('utc', now()) - interval '14 days'
  ),
  (
    'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'Registration help desk',
    'August 24 and August 31, 7:00 PM',
    'A representative public entry for packet pickup questions, missing signature follow-up, and school-year launch reminders.',
    'Parents and guardians',
    30,
    'published',
    true,
    timezone('utc', now()) - interval '12 days'
  ),
  (
    'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    'Lenten retreat paperwork deadline',
    'March 10, 2026',
    'This is the kind of date that should appear in both the schedule and a linked announcement with the downloadable checklist.',
    'Registered students and families',
    40,
    'published',
    true,
    timezone('utc', now()) - interval '7 days'
  ),
  (
    'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    'Opening Sunday orientation',
    'September 13, 2026',
    'Useful for parent reminders, classroom arrival instructions, and family-facing handbooks without exposing private student data.',
    'New families and returning households',
    50,
    'published',
    true,
    timezone('utc', now()) - interval '2 days'
  )
on conflict (id) do update
set
  title_en = excluded.title_en,
  date_label_en = excluded.date_label_en,
  note_en = excluded.note_en,
  audience = excluded.audience,
  sort_order = excluded.sort_order,
  status = excluded.status,
  is_featured = excluded.is_featured,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());

insert into public.cms_resources (
  id,
  title_en,
  description_en,
  audience,
  availability_label,
  link_url,
  file_media_id,
  sort_order,
  status,
  is_featured,
  published_at
)
values
  (
    'bbbbbbb1-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    '2026-2027 family registration packet',
    'A seeded local-development file stands in for the real packet so editors can verify the public download flow before launch.',
    'Families registering students',
    'Representative demo file available',
    null,
    '11111111-1111-4111-8111-111111111111',
    10,
    'published',
    true,
    timezone('utc', now()) - interval '14 days'
  ),
  (
    'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    'Retreat family checklist',
    'Seasonal files can appear, expire, and be replaced without changing the page layout or the parent-facing information architecture.',
    'Families responding to special events',
    'Representative demo file available',
    null,
    '22222222-2222-4222-8222-222222222222',
    20,
    'published',
    false,
    timezone('utc', now()) - interval '7 days'
  ),
  (
    'bbbbbbb3-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
    'Family handbook summary',
    'Evergreen guidance can live beside seasonal packets so the public site becomes the obvious place to re-check chapter expectations.',
    'Parents, students, and staff',
    'Representative external link',
    'https://example.com/family-handbook-summary',
    null,
    30,
    'published',
    false,
    timezone('utc', now()) - interval '5 days'
  )
on conflict (id) do update
set
  title_en = excluded.title_en,
  description_en = excluded.description_en,
  audience = excluded.audience,
  availability_label = excluded.availability_label,
  link_url = excluded.link_url,
  file_media_id = excluded.file_media_id,
  sort_order = excluded.sort_order,
  status = excluded.status,
  is_featured = excluded.is_featured,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());

insert into public.crm_families (
  id,
  household_name,
  home_address,
  emergency_contact_name,
  emergency_contact_relationship,
  emergency_contact_phone,
  notes
)
values
  (
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    'Nguyen household',
    'Representative address, Surrey BC',
    'Linh Nguyen',
    'Aunt',
    '604-555-0101',
    'Representative demo household for local QA.'
  ),
  (
    'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    'Tran household',
    'Representative address, Surrey BC',
    'Peter Tran',
    'Uncle',
    '604-555-0102',
    'Representative demo household for local QA.'
  )
on conflict (id) do update
set
  household_name = excluded.household_name,
  home_address = excluded.home_address,
  emergency_contact_name = excluded.emergency_contact_name,
  emergency_contact_relationship = excluded.emergency_contact_relationship,
  emergency_contact_phone = excluded.emergency_contact_phone,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

insert into public.crm_guardians (
  id,
  family_id,
  full_name,
  relationship_label,
  phone,
  email,
  is_primary_contact,
  sort_order,
  notes
)
values
  (
    'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1',
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    'Andrew Nguyen',
    'Father',
    '604-555-0201',
    'andrew.nguyen@example.com',
    true,
    1,
    'Representative demo guardian.'
  ),
  (
    'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2',
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    'Maria Nguyen',
    'Mother',
    '604-555-0202',
    'maria.nguyen@example.com',
    false,
    2,
    'Representative demo guardian.'
  ),
  (
    'ddddddd3-dddd-4ddd-8ddd-ddddddddddd3',
    'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    'Paul Tran',
    'Father',
    '604-555-0203',
    'paul.tran@example.com',
    true,
    1,
    'Representative demo guardian.'
  )
on conflict (id) do update
set
  family_id = excluded.family_id,
  full_name = excluded.full_name,
  relationship_label = excluded.relationship_label,
  phone = excluded.phone,
  email = excluded.email,
  is_primary_contact = excluded.is_primary_contact,
  sort_order = excluded.sort_order,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

insert into public.crm_students (
  id,
  family_id,
  legal_first_name,
  legal_last_name,
  preferred_name,
  saint_name,
  birthdate,
  gender_value,
  email,
  health_support_notes,
  baptism_completed,
  first_communion_completed,
  confirmation_completed,
  notes
)
values
  (
    'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    'Anna',
    'Nguyen',
    null,
    'Maria',
    date '2017-05-04',
    'Female',
    null,
    null,
    true,
    false,
    false,
    'Representative demo student in a ready roster state.'
  ),
  (
    'eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2',
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    'Michael',
    'Nguyen',
    'Mika',
    'Giuse',
    date '2014-09-18',
    'Male',
    null,
    'Peanut allergy note for demo purposes.',
    true,
    true,
    false,
    'Representative demo student whose paper registration still needs follow-up.'
  ),
  (
    'eeeeeee3-eeee-4eee-8eee-eeeeeeeeeee3',
    'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    'Sophia',
    'Tran',
    null,
    'Cecilia',
    date '2011-02-11',
    'Female',
    'sophia.tran@example.com',
    null,
    true,
    true,
    true,
    'Representative demo student with follow-up-required status.'
  )
on conflict (id) do update
set
  family_id = excluded.family_id,
  legal_first_name = excluded.legal_first_name,
  legal_last_name = excluded.legal_last_name,
  preferred_name = excluded.preferred_name,
  saint_name = excluded.saint_name,
  birthdate = excluded.birthdate,
  gender_value = excluded.gender_value,
  email = excluded.email,
  health_support_notes = excluded.health_support_notes,
  baptism_completed = excluded.baptism_completed,
  first_communion_completed = excluded.first_communion_completed,
  confirmation_completed = excluded.confirmation_completed,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

insert into public.crm_student_guardians (
  student_id,
  guardian_id,
  relationship_label,
  is_primary
)
values
  ('eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1', 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1', 'Father', true),
  ('eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1', 'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2', 'Mother', false),
  ('eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2', 'ddddddd1-dddd-4ddd-8ddd-ddddddddddd1', 'Father', true),
  ('eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2', 'ddddddd2-dddd-4ddd-8ddd-ddddddddddd2', 'Mother', false),
  ('eeeeeee3-eeee-4eee-8eee-eeeeeeeeeee3', 'ddddddd3-dddd-4ddd-8ddd-ddddddddddd3', 'Father', true)
on conflict (student_id, guardian_id) do update
set
  relationship_label = excluded.relationship_label,
  is_primary = excluded.is_primary;

insert into public.crm_student_registrations (
  id,
  student_id,
  family_id,
  registration_cycle_id,
  division_level_id,
  class_group_id,
  registration_status,
  team_name,
  intake_entered_at,
  is_returning_student,
  certificate_status,
  certificate_notes,
  total_charged,
  total_paid,
  uniform_shirt_size,
  uniform_scarf_needed,
  parent_notified_status,
  legacy_requested_programs,
  import_notes,
  notes
)
values
  (
    'fffffff1-ffff-4fff-8fff-fffffffffff1',
    'eeeeeee1-eeee-4eee-8eee-eeeeeeeeeee1',
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    (select id from public.crm_registration_cycles where slug = '2025-2026'),
    (select id from public.crm_division_levels where code = 'AN2'),
    (select id from public.crm_class_groups where slug = 'ruoc-le-lan-dau'),
    'active',
    'St. Maria',
    timezone('utc', now()) - interval '20 days',
    true,
    'known_student',
    'Returning student with prior sacrament history on file.',
    80.00,
    80.00,
    'S',
    false,
    'Family confirmed opening weekend attendance.',
    'Sunday formation',
    'Representative demo import note.',
    'Ready record used to verify roster filtering and CSV export.'
  ),
  (
    'fffffff2-ffff-4fff-8fff-fffffffffff2',
    'eeeeeee2-eeee-4eee-8eee-eeeeeeeeeee2',
    'ccccccc1-cccc-4ccc-8ccc-ccccccccccc1',
    (select id from public.crm_registration_cycles where slug = '2025-2026'),
    (select id from public.crm_division_levels where code = 'TN2'),
    (select id from public.crm_class_groups where slug = 'du-bi-them-suc'),
    'paper_form_received',
    'St. Giuse',
    timezone('utc', now()) - interval '5 days',
    true,
    'partial',
    'Paper packet received, sacrament details still being confirmed.',
    80.00,
    40.00,
    'M',
    true,
    'Needs follow-up call about missing signature.',
    'Sunday formation',
    'Entered from paper packet for QA workflow coverage.',
    'This record demonstrates the paper-registration intake path.'
  ),
  (
    'fffffff3-ffff-4fff-8fff-fffffffffff3',
    'eeeeeee3-eeee-4eee-8eee-eeeeeeeeeee3',
    'ccccccc2-cccc-4ccc-8ccc-ccccccccccc2',
    (select id from public.crm_registration_cycles where slug = '2025-2026'),
    (select id from public.crm_division_levels where code = 'NS1'),
    (select id from public.crm_class_groups where slug = 'nghia-si-i'),
    'follow_up_required',
    'St. Phaolo',
    timezone('utc', now()) - interval '3 days',
    false,
    'missing',
    'Certificate copy still outstanding.',
    80.00,
    0.00,
    'L',
    false,
    'Family asked for callback after Sunday Mass.',
    'Youth formation',
    'Representative demo follow-up case.',
    'This record gives the roster view a second needs-attention example.'
  )
on conflict (id) do update
set
  student_id = excluded.student_id,
  family_id = excluded.family_id,
  registration_cycle_id = excluded.registration_cycle_id,
  division_level_id = excluded.division_level_id,
  class_group_id = excluded.class_group_id,
  registration_status = excluded.registration_status,
  team_name = excluded.team_name,
  intake_entered_at = excluded.intake_entered_at,
  is_returning_student = excluded.is_returning_student,
  certificate_status = excluded.certificate_status,
  certificate_notes = excluded.certificate_notes,
  total_charged = excluded.total_charged,
  total_paid = excluded.total_paid,
  uniform_shirt_size = excluded.uniform_shirt_size,
  uniform_scarf_needed = excluded.uniform_scarf_needed,
  parent_notified_status = excluded.parent_notified_status,
  legacy_requested_programs = excluded.legacy_requested_programs,
  import_notes = excluded.import_notes,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

insert into public.crm_registration_attachments (
  id,
  student_registration_id,
  label,
  storage_bucket,
  storage_path,
  notes
)
values
  (
    'abababab-abab-4bab-8bab-abababababab',
    'fffffff2-ffff-4fff-8fff-fffffffffff2',
    'Scanned paper registration',
    'private-registration-files',
    'demo/paper-registration-michael-nguyen.pdf',
    'Representative private attachment reference for local QA.'
  ),
  (
    'bcbcbcbc-bcbc-4cbc-8cbc-bcbcbcbcbcbc',
    'fffffff3-ffff-4fff-8fff-fffffffffff3',
    'Certificate follow-up note',
    null,
    null,
    'Family still needs to provide the certificate copy.'
  )
on conflict (id) do update
set
  student_registration_id = excluded.student_registration_id,
  label = excluded.label,
  storage_bucket = excluded.storage_bucket,
  storage_path = excluded.storage_path,
  notes = excluded.notes,
  updated_at = timezone('utc', now());
