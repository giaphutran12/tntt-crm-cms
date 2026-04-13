import "server-only";

import { query } from "@/server/db";

export const CRM_MACRO_DIVISIONS = [
  "au_nhi",
  "thieu_nhi",
  "nghia_si",
  "hiep_si",
] as const;
export type CrmMacroDivision = (typeof CRM_MACRO_DIVISIONS)[number];

export const CRM_REGISTRATION_STATUSES = [
  "draft",
  "paper_form_received",
  "entered",
  "missing_information",
  "follow_up_required",
  "active",
  "inactive",
] as const;
export type CrmRegistrationStatus = (typeof CRM_REGISTRATION_STATUSES)[number];

export const CRM_CERTIFICATE_STATUSES = [
  "unknown",
  "missing",
  "partial",
  "complete",
  "known_student",
  "waived",
] as const;
export type CrmCertificateStatus = (typeof CRM_CERTIFICATE_STATUSES)[number];

export const CRM_ROSTER_ATTENTION_FILTERS = [
  "all",
  "needs_attention",
  "ready",
] as const;
export type CrmRosterAttentionFilter = (typeof CRM_ROSTER_ATTENTION_FILTERS)[number];

export type CrmGuardian = {
  createdAt: string;
  email: string | null;
  familyId: string;
  fullName: string;
  id: string;
  isPrimaryContact: boolean;
  notes: string | null;
  phone: string | null;
  relationshipLabel: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type CrmFamily = {
  createdAt: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  guardians: CrmGuardian[];
  homeAddress: string;
  householdName: string;
  id: string;
  notes: string | null;
  studentCount: number;
  updatedAt: string;
};

export type CrmStudent = {
  baptismCompleted: boolean | null;
  birthdate: string | null;
  confirmationCompleted: boolean | null;
  createdAt: string;
  email: string | null;
  familyId: string | null;
  familyName: string | null;
  firstCommunionCompleted: boolean | null;
  fullName: string;
  genderValue: string | null;
  guardians: CrmGuardian[];
  healthSupportNotes: string | null;
  id: string;
  legalFirstName: string;
  legalLastName: string;
  notes: string | null;
  phone: string | null;
  preferredName: string | null;
  registrationCount: number;
  saintName: string | null;
  updatedAt: string;
};

export type CrmDivisionLevel = {
  assignmentCount: number;
  code: string;
  createdAt: string;
  id: string;
  isActive: boolean;
  label: string;
  macroDivision: CrmMacroDivision;
  notes: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type CrmClassGroup = {
  assignmentCount: number;
  createdAt: string;
  defaultDivisionCode: string | null;
  defaultDivisionId: string | null;
  defaultDivisionLabel: string | null;
  id: string;
  isActive: boolean;
  name: string;
  notes: string | null;
  slug: string;
  sortOrder: number;
  updatedAt: string;
};

export type CrmRegistrationCycle = {
  createdAt: string;
  endsOn: string | null;
  id: string;
  isActive: boolean;
  name: string;
  notes: string | null;
  registrationCount: number;
  schoolYearLabel: string;
  slug: string;
  startsOn: string | null;
  updatedAt: string;
};

export type CrmRegistrationAttachment = {
  attachmentUrl: string | null;
  createdAt: string;
  displayReference: string;
  id: string;
  label: string;
  notes: string | null;
  storageBucket: string | null;
  storagePath: string | null;
  updatedAt: string;
};

export type CrmStudentRegistration = {
  attachments: CrmRegistrationAttachment[];
  certificateNotes: string | null;
  certificateStatus: CrmCertificateStatus;
  classGroupId: string | null;
  classGroupName: string | null;
  createdAt: string;
  cycleName: string;
  cycleSchoolYearLabel: string;
  divisionCode: string | null;
  divisionId: string | null;
  divisionLabel: string | null;
  familyId: string | null;
  familyName: string | null;
  id: string;
  importNotes: string | null;
  intakeEnteredAt: string | null;
  isReturningStudent: boolean | null;
  legacyRequestedPrograms: string | null;
  notes: string | null;
  parentNotifiedStatus: string | null;
  registrationCycleId: string;
  registrationStatus: CrmRegistrationStatus;
  studentId: string;
  studentName: string;
  teamName: string | null;
  totalCharged: string | null;
  totalPaid: string | null;
  uniformScarfNeeded: boolean | null;
  uniformShirtSize: string | null;
  updatedAt: string;
};

export type CrmRosterFilters = {
  attention: CrmRosterAttentionFilter;
  classGroupId: string | null;
  cycleId: string | null;
  divisionId: string | null;
  registrationStatus: CrmRegistrationStatus | null;
  team: string | null;
};

export type CrmRosterRecord = {
  attentionReasons: string[];
  certificateStatus: CrmCertificateStatus;
  classGroupId: string | null;
  classGroupName: string | null;
  cycleId: string;
  cycleName: string;
  cycleSchoolYearLabel: string;
  divisionCode: string | null;
  divisionId: string | null;
  divisionLabel: string | null;
  familyId: string | null;
  familyName: string | null;
  id: string;
  intakeEnteredAt: string | null;
  needsAttention: boolean;
  parentNotifiedStatus: string | null;
  primaryGuardianEmail: string | null;
  primaryGuardianName: string | null;
  primaryGuardianPhone: string | null;
  registrationStatus: CrmRegistrationStatus;
  studentId: string;
  studentName: string;
  teamName: string | null;
  totalCharged: string | null;
  totalPaid: string | null;
};

type CrmDbAccessContext = {
  userId: string;
};

type CrmGuardianRow = {
  created_at: string;
  email: string | null;
  family_id: string;
  full_name: string;
  id: string;
  is_primary_contact: boolean;
  notes: string | null;
  phone: string | null;
  relationship_label: string | null;
  sort_order: number;
  updated_at: string;
};

type CrmFamilyRow = {
  created_at: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  home_address: string;
  household_name: string;
  id: string;
  notes: string | null;
  updated_at: string;
};

type CrmFamilyStudentCountRow = {
  family_id: string;
  student_count: number;
};

type CrmStudentRow = {
  baptism_completed: boolean | null;
  birthdate: string | null;
  confirmation_completed: boolean | null;
  created_at: string;
  email: string | null;
  family_id: string | null;
  family_name: string | null;
  first_communion_completed: boolean | null;
  id: string;
  legal_first_name: string;
  legal_last_name: string;
  notes: string | null;
  phone: string | null;
  preferred_name: string | null;
  saint_name: string | null;
  gender_value: string | null;
  health_support_notes: string | null;
  updated_at: string;
};

type CrmStudentGuardianRow = CrmGuardianRow & {
  student_id: string;
};

type CrmStudentRegistrationCountRow = {
  registration_count: number;
  student_id: string;
};

type CrmDivisionLevelRow = {
  assignment_count: number;
  code: string;
  created_at: string;
  id: string;
  is_active: boolean;
  label: string;
  macro_division: CrmMacroDivision;
  notes: string | null;
  sort_order: number;
  updated_at: string;
};

type CrmClassGroupRow = {
  assignment_count: number;
  created_at: string;
  default_division_code: string | null;
  default_division_id: string | null;
  default_division_label: string | null;
  id: string;
  is_active: boolean;
  name: string;
  notes: string | null;
  slug: string;
  sort_order: number;
  updated_at: string;
};

type CrmRegistrationCycleRow = {
  created_at: string;
  ends_on: string | null;
  id: string;
  is_active: boolean;
  name: string;
  notes: string | null;
  registration_count: number;
  school_year_label: string;
  slug: string;
  starts_on: string | null;
  updated_at: string;
};

type CrmStudentRegistrationRow = {
  certificate_notes: string | null;
  certificate_status: CrmCertificateStatus;
  class_group_id: string | null;
  class_group_name: string | null;
  created_at: string;
  cycle_name: string;
  cycle_school_year_label: string;
  division_code: string | null;
  division_id: string | null;
  division_label: string | null;
  family_id: string | null;
  family_name: string | null;
  id: string;
  import_notes: string | null;
  intake_entered_at: string | null;
  is_returning_student: boolean | null;
  legacy_requested_programs: string | null;
  notes: string | null;
  parent_notified_status: string | null;
  registration_cycle_id: string;
  registration_status: CrmRegistrationStatus;
  student_id: string;
  student_name: string;
  team_name: string | null;
  total_charged: string | null;
  total_paid: string | null;
  uniform_scarf_needed: boolean | null;
  uniform_shirt_size: string | null;
  updated_at: string;
};

type CrmRegistrationAttachmentRow = {
  attachment_url: string | null;
  created_at: string;
  id: string;
  label: string;
  notes: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  student_registration_id: string;
  updated_at: string;
};

type CrmRosterRow = {
  certificate_status: CrmCertificateStatus;
  class_group_id: string | null;
  class_group_name: string | null;
  cycle_id: string;
  cycle_name: string;
  cycle_school_year_label: string;
  division_code: string | null;
  division_id: string | null;
  division_label: string | null;
  family_id: string | null;
  family_name: string | null;
  id: string;
  intake_entered_at: string | null;
  parent_notified_status: string | null;
  primary_guardian_email: string | null;
  primary_guardian_name: string | null;
  primary_guardian_phone: string | null;
  registration_status: CrmRegistrationStatus;
  student_id: string;
  student_name: string;
  team_name: string | null;
  total_charged: string | null;
  total_paid: string | null;
};

function mapGuardian(row: CrmGuardianRow): CrmGuardian {
  return {
    createdAt: row.created_at,
    email: row.email,
    familyId: row.family_id,
    fullName: row.full_name,
    id: row.id,
    isPrimaryContact: row.is_primary_contact,
    notes: row.notes,
    phone: row.phone,
    relationshipLabel: row.relationship_label,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function mapFamily(row: CrmFamilyRow, guardians: CrmGuardian[], studentCount: number): CrmFamily {
  return {
    createdAt: row.created_at,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelationship: row.emergency_contact_relationship,
    guardians,
    homeAddress: row.home_address,
    householdName: row.household_name,
    id: row.id,
    notes: row.notes,
    studentCount,
    updatedAt: row.updated_at,
  };
}

function getStudentFullName(student: {
  legal_first_name: string;
  legal_last_name: string;
  preferred_name: string | null;
}) {
  if (student.preferred_name) {
    return `${student.preferred_name} (${student.legal_first_name} ${student.legal_last_name})`;
  }

  return `${student.legal_first_name} ${student.legal_last_name}`;
}

function mapStudent(
  row: CrmStudentRow,
  guardians: CrmGuardian[],
  registrationCount: number,
): CrmStudent {
  return {
    baptismCompleted: row.baptism_completed,
    birthdate: row.birthdate,
    confirmationCompleted: row.confirmation_completed,
    createdAt: row.created_at,
    email: row.email,
    familyId: row.family_id,
    familyName: row.family_name,
    firstCommunionCompleted: row.first_communion_completed,
    fullName: getStudentFullName(row),
    genderValue: row.gender_value,
    guardians,
    healthSupportNotes: row.health_support_notes,
    id: row.id,
    legalFirstName: row.legal_first_name,
    legalLastName: row.legal_last_name,
    notes: row.notes,
    phone: row.phone,
    preferredName: row.preferred_name,
    registrationCount,
    saintName: row.saint_name,
    updatedAt: row.updated_at,
  };
}

function mapDivisionLevel(row: CrmDivisionLevelRow): CrmDivisionLevel {
  return {
    assignmentCount: row.assignment_count,
    code: row.code,
    createdAt: row.created_at,
    id: row.id,
    isActive: row.is_active,
    label: row.label,
    macroDivision: row.macro_division,
    notes: row.notes,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function mapClassGroup(row: CrmClassGroupRow): CrmClassGroup {
  return {
    assignmentCount: row.assignment_count,
    createdAt: row.created_at,
    defaultDivisionCode: row.default_division_code,
    defaultDivisionId: row.default_division_id,
    defaultDivisionLabel: row.default_division_label,
    id: row.id,
    isActive: row.is_active,
    name: row.name,
    notes: row.notes,
    slug: row.slug,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function mapRegistrationCycle(row: CrmRegistrationCycleRow): CrmRegistrationCycle {
  return {
    createdAt: row.created_at,
    endsOn: row.ends_on,
    id: row.id,
    isActive: row.is_active,
    name: row.name,
    notes: row.notes,
    registrationCount: row.registration_count,
    schoolYearLabel: row.school_year_label,
    slug: row.slug,
    startsOn: row.starts_on,
    updatedAt: row.updated_at,
  };
}

function mapRegistrationAttachment(row: CrmRegistrationAttachmentRow): CrmRegistrationAttachment {
  const displayReference =
    row.attachment_url ??
    (row.storage_bucket && row.storage_path
      ? `${row.storage_bucket}/${row.storage_path}`
      : row.storage_path ?? row.notes ?? row.label);

  return {
    attachmentUrl: row.attachment_url,
    createdAt: row.created_at,
    displayReference,
    id: row.id,
    label: row.label,
    notes: row.notes,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    updatedAt: row.updated_at,
  };
}

function mapStudentRegistration(
  row: CrmStudentRegistrationRow,
  attachments: CrmRegistrationAttachment[],
): CrmStudentRegistration {
  return {
    attachments,
    certificateNotes: row.certificate_notes,
    certificateStatus: row.certificate_status,
    classGroupId: row.class_group_id,
    classGroupName: row.class_group_name,
    createdAt: row.created_at,
    cycleName: row.cycle_name,
    cycleSchoolYearLabel: row.cycle_school_year_label,
    divisionCode: row.division_code,
    divisionId: row.division_id,
    divisionLabel: row.division_label,
    familyId: row.family_id,
    familyName: row.family_name,
    id: row.id,
    importNotes: row.import_notes,
    intakeEnteredAt: row.intake_entered_at,
    isReturningStudent: row.is_returning_student,
    legacyRequestedPrograms: row.legacy_requested_programs,
    notes: row.notes,
    parentNotifiedStatus: row.parent_notified_status,
    registrationCycleId: row.registration_cycle_id,
    registrationStatus: row.registration_status,
    studentId: row.student_id,
    studentName: row.student_name,
    teamName: row.team_name,
    totalCharged: row.total_charged,
    totalPaid: row.total_paid,
    uniformScarfNeeded: row.uniform_scarf_needed,
    uniformShirtSize: row.uniform_shirt_size,
    updatedAt: row.updated_at,
  };
}

function normalizeOptionalFilterValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isRegistrationStatus(value: string | null): value is CrmRegistrationStatus {
  return value ? CRM_REGISTRATION_STATUSES.includes(value as CrmRegistrationStatus) : false;
}

function isRosterAttentionFilter(value: string | null): value is CrmRosterAttentionFilter {
  return value
    ? CRM_ROSTER_ATTENTION_FILTERS.includes(value as CrmRosterAttentionFilter)
    : false;
}

function getRosterAttentionReasons(record: {
  certificateStatus: CrmCertificateStatus;
  classGroupId: string | null;
  divisionId: string | null;
  registrationStatus: CrmRegistrationStatus;
}) {
  const reasons: string[] = [];

  switch (record.registrationStatus) {
    case "draft":
      reasons.push("Draft registration still needs full processing.");
      break;
    case "paper_form_received":
      reasons.push("Paper form is received but data entry is not finished.");
      break;
    case "missing_information":
      reasons.push("Registration is missing required information.");
      break;
    case "follow_up_required":
      reasons.push("Registration is explicitly marked for follow-up.");
      break;
    default:
      break;
  }

  if (!record.divisionId) {
    reasons.push("Division placement is still missing.");
  }

  if (!record.classGroupId) {
    reasons.push("Class placement is still missing.");
  }

  if (record.certificateStatus === "missing") {
    reasons.push("Certificate details are still missing.");
  } else if (record.certificateStatus === "partial") {
    reasons.push("Certificate details are only partially recorded.");
  }

  return reasons;
}

function mapRosterRecord(row: CrmRosterRow): CrmRosterRecord {
  const baseRecord = {
    certificateStatus: row.certificate_status,
    classGroupId: row.class_group_id,
    classGroupName: row.class_group_name,
    cycleId: row.cycle_id,
    cycleName: row.cycle_name,
    cycleSchoolYearLabel: row.cycle_school_year_label,
    divisionCode: row.division_code,
    divisionId: row.division_id,
    divisionLabel: row.division_label,
    familyId: row.family_id,
    familyName: row.family_name,
    id: row.id,
    intakeEnteredAt: row.intake_entered_at,
    parentNotifiedStatus: row.parent_notified_status,
    primaryGuardianEmail: row.primary_guardian_email,
    primaryGuardianName: row.primary_guardian_name,
    primaryGuardianPhone: row.primary_guardian_phone,
    registrationStatus: row.registration_status,
    studentId: row.student_id,
    studentName: row.student_name,
    teamName: row.team_name,
    totalCharged: row.total_charged,
    totalPaid: row.total_paid,
  };
  const attentionReasons = getRosterAttentionReasons(baseRecord);

  return {
    ...baseRecord,
    attentionReasons,
    needsAttention: attentionReasons.length > 0,
  };
}

function applyRosterAttentionFilter(
  records: CrmRosterRecord[],
  attention: CrmRosterAttentionFilter,
) {
  if (attention === "all") {
    return records;
  }

  return records.filter((record) =>
    attention === "needs_attention" ? record.needsAttention : !record.needsAttention,
  );
}

function toCsvValue(value: string | null | number | boolean) {
  const stringValue = value == null ? "" : String(value);

  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll("\"", "\"\"")}"`;
}

function toMoneyNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCrmEnumLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function parseCrmRosterFilters(input: {
  attention?: string | null;
  classGroupId?: string | null;
  cycleId?: string | null;
  divisionId?: string | null;
  registrationStatus?: string | null;
  team?: string | null;
}): CrmRosterFilters {
  const registrationStatus = normalizeOptionalFilterValue(input.registrationStatus);
  const attention = normalizeOptionalFilterValue(input.attention);

  return {
    attention: isRosterAttentionFilter(attention) ? attention : "all",
    classGroupId: normalizeOptionalFilterValue(input.classGroupId),
    cycleId: normalizeOptionalFilterValue(input.cycleId),
    divisionId: normalizeOptionalFilterValue(input.divisionId),
    registrationStatus: isRegistrationStatus(registrationStatus)
      ? registrationStatus
      : null,
    team: normalizeOptionalFilterValue(input.team),
  };
}

export function applyDefaultRosterCycle(
  filters: CrmRosterFilters,
  cycles: CrmRegistrationCycle[],
) {
  if (filters.cycleId) {
    return filters;
  }

  const activeCycle = cycles.find((cycle) => cycle.isActive);

  if (!activeCycle) {
    return filters;
  }

  return {
    ...filters,
    cycleId: activeCycle.id,
  };
}

export function serializeRosterRecordsToCsv(records: CrmRosterRecord[]) {
  const headers = [
    "School Year",
    "Cycle",
    "Division Code",
    "Division",
    "Class",
    "Team",
    "Registration Status",
    "Needs Attention",
    "Attention Reasons",
    "Student",
    "Household",
    "Primary Guardian",
    "Guardian Phone",
    "Guardian Email",
    "Parent Notified",
    "Certificate Status",
    "Intake Entered At",
    "Charged",
    "Paid",
    "Balance Due",
  ];

  const rows = records.map((record) => {
    const charged = toMoneyNumber(record.totalCharged);
    const paid = toMoneyNumber(record.totalPaid);
    const balanceDue =
      charged != null && paid != null ? (charged - paid).toFixed(2) : "";

    return [
      record.cycleSchoolYearLabel,
      record.cycleName,
      record.divisionCode ?? "",
      record.divisionLabel ?? "",
      record.classGroupName ?? "",
      record.teamName ?? "",
      formatCrmEnumLabel(record.registrationStatus),
      record.needsAttention ? "yes" : "no",
      record.attentionReasons.join(" | "),
      record.studentName,
      record.familyName ?? "",
      record.primaryGuardianName ?? "",
      record.primaryGuardianPhone ?? "",
      record.primaryGuardianEmail ?? "",
      record.parentNotifiedStatus ?? "",
      formatCrmEnumLabel(record.certificateStatus),
      record.intakeEnteredAt ?? "",
      record.totalCharged ?? "",
      record.totalPaid ?? "",
      balanceDue,
    ]
      .map(toCsvValue)
      .join(",");
  });

  return [headers.map(toCsvValue).join(","), ...rows].join("\n");
}

export async function listFamiliesForAdmin(accessContext: CrmDbAccessContext) {
  const [familyResult, guardianResult, studentCountResult] = await Promise.all([
    query<CrmFamilyRow>(`
      select
        id::text as id,
        household_name,
        home_address,
        emergency_contact_name,
        emergency_contact_relationship,
        emergency_contact_phone,
        notes,
        created_at::text as created_at,
        updated_at::text as updated_at
      from public.crm_families
      order by household_name asc, created_at asc
    `, [], accessContext),
    query<CrmGuardianRow>(`
      select
        id::text as id,
        family_id::text as family_id,
        full_name,
        relationship_label,
        phone,
        email,
        is_primary_contact,
        sort_order,
        notes,
        created_at::text as created_at,
        updated_at::text as updated_at
      from public.crm_guardians
      order by family_id asc, is_primary_contact desc, sort_order asc, full_name asc
    `, [], accessContext),
    query<CrmFamilyStudentCountRow>(`
      select
        family_id::text as family_id,
        count(*)::int as student_count
      from public.crm_students
      where family_id is not null
      group by family_id
    `, [], accessContext),
  ]);

  const guardiansByFamily = new Map<string, CrmGuardian[]>();

  for (const guardianRow of guardianResult.rows) {
    const mappedGuardian = mapGuardian(guardianRow);
    const existing = guardiansByFamily.get(mappedGuardian.familyId) ?? [];
    existing.push(mappedGuardian);
    guardiansByFamily.set(mappedGuardian.familyId, existing);
  }

  const countsByFamily = new Map(
    studentCountResult.rows.map((row) => [row.family_id, row.student_count]),
  );

  return familyResult.rows.map((row) =>
    mapFamily(row, guardiansByFamily.get(row.id) ?? [], countsByFamily.get(row.id) ?? 0),
  );
}

export async function listStudentsForAdmin(accessContext: CrmDbAccessContext) {
  const [studentResult, guardianResult, registrationCountResult] = await Promise.all([
    query<CrmStudentRow>(`
      select
        student.id::text as id,
        student.family_id::text as family_id,
        family.household_name as family_name,
        student.legal_first_name,
        student.legal_last_name,
        student.preferred_name,
        student.saint_name,
        student.birthdate::text as birthdate,
        student.gender_value,
        student.email,
        student.phone,
        student.health_support_notes,
        student.baptism_completed,
        student.first_communion_completed,
        student.confirmation_completed,
        student.notes,
        student.created_at::text as created_at,
        student.updated_at::text as updated_at
      from public.crm_students student
      left join public.crm_families family
        on family.id = student.family_id
      order by student.legal_last_name asc, student.legal_first_name asc
    `, [], accessContext),
    query<CrmStudentGuardianRow>(`
      select
        link.student_id::text as student_id,
        guardian.id::text as id,
        guardian.family_id::text as family_id,
        guardian.full_name,
        coalesce(link.relationship_label, guardian.relationship_label) as relationship_label,
        guardian.phone,
        guardian.email,
        guardian.is_primary_contact,
        guardian.sort_order,
        guardian.notes,
        guardian.created_at::text as created_at,
        guardian.updated_at::text as updated_at
      from public.crm_student_guardians link
      inner join public.crm_guardians guardian
        on guardian.id = link.guardian_id
      order by link.student_id asc, guardian.is_primary_contact desc, guardian.sort_order asc, guardian.full_name asc
    `, [], accessContext),
    query<CrmStudentRegistrationCountRow>(`
      select
        student_id::text as student_id,
        count(*)::int as registration_count
      from public.crm_student_registrations
      group by student_id
    `, [], accessContext),
  ]);

  const guardiansByStudent = new Map<string, CrmGuardian[]>();

  for (const guardianRow of guardianResult.rows) {
    const guardian = mapGuardian(guardianRow);
    const current = guardiansByStudent.get(guardianRow.student_id) ?? [];
    current.push(guardian);
    guardiansByStudent.set(guardianRow.student_id, current);
  }

  const countsByStudent = new Map(
    registrationCountResult.rows.map((row) => [row.student_id, row.registration_count]),
  );

  return studentResult.rows.map((row) =>
    mapStudent(row, guardiansByStudent.get(row.id) ?? [], countsByStudent.get(row.id) ?? 0),
  );
}

export async function listDivisionLevelsForAdmin(accessContext: CrmDbAccessContext) {
  const result = await query<CrmDivisionLevelRow>(`
    select
      division.id::text as id,
      division.code,
      division.label,
      division.macro_division::text as macro_division,
      division.sort_order,
      division.is_active,
      division.notes,
      division.created_at::text as created_at,
      division.updated_at::text as updated_at,
      count(registration.id)::int as assignment_count
    from public.crm_division_levels division
    left join public.crm_student_registrations registration
      on registration.division_level_id = division.id
    group by division.id
    order by division.sort_order asc, division.code asc
  `, [], accessContext);

  return result.rows.map(mapDivisionLevel);
}

export async function listClassGroupsForAdmin(accessContext: CrmDbAccessContext) {
  const result = await query<CrmClassGroupRow>(`
    select
      class_group.id::text as id,
      class_group.slug,
      class_group.name,
      class_group.default_division_id::text as default_division_id,
      division.code as default_division_code,
      division.label as default_division_label,
      class_group.sort_order,
      class_group.is_active,
      class_group.notes,
      class_group.created_at::text as created_at,
      class_group.updated_at::text as updated_at,
      count(registration.id)::int as assignment_count
    from public.crm_class_groups class_group
    left join public.crm_division_levels division
      on division.id = class_group.default_division_id
    left join public.crm_student_registrations registration
      on registration.class_group_id = class_group.id
    group by class_group.id, division.code, division.label
    order by class_group.sort_order asc, class_group.name asc
  `, [], accessContext);

  return result.rows.map(mapClassGroup);
}

export async function listRegistrationCyclesForAdmin(accessContext: CrmDbAccessContext) {
  const result = await query<CrmRegistrationCycleRow>(`
    select
      cycle.id::text as id,
      cycle.slug,
      cycle.name,
      cycle.school_year_label,
      cycle.starts_on::text as starts_on,
      cycle.ends_on::text as ends_on,
      cycle.is_active,
      cycle.notes,
      cycle.created_at::text as created_at,
      cycle.updated_at::text as updated_at,
      count(registration.id)::int as registration_count
    from public.crm_registration_cycles cycle
    left join public.crm_student_registrations registration
      on registration.registration_cycle_id = cycle.id
    group by cycle.id
    order by cycle.school_year_label desc, cycle.created_at desc
  `, [], accessContext);

  return result.rows.map(mapRegistrationCycle);
}

export async function listStudentRegistrationsForAdmin(
  accessContext: CrmDbAccessContext,
) {
  const registrationResult = await query<CrmStudentRegistrationRow>(`
    select
      registration.id::text as id,
      registration.student_id::text as student_id,
      case
        when student.preferred_name is not null and student.preferred_name <> ''
          then student.preferred_name || ' (' || student.legal_first_name || ' ' || student.legal_last_name || ')'
        else student.legal_first_name || ' ' || student.legal_last_name
      end as student_name,
      registration.family_id::text as family_id,
      family.household_name as family_name,
      registration.registration_cycle_id::text as registration_cycle_id,
      cycle.name as cycle_name,
      cycle.school_year_label as cycle_school_year_label,
      registration.division_level_id::text as division_id,
      division.code as division_code,
      division.label as division_label,
      registration.class_group_id::text as class_group_id,
      class_group.name as class_group_name,
      registration.registration_status::text as registration_status,
      registration.team_name,
      registration.intake_entered_at::text as intake_entered_at,
      registration.is_returning_student,
      registration.certificate_status::text as certificate_status,
      registration.certificate_notes,
      registration.total_charged::text as total_charged,
      registration.total_paid::text as total_paid,
      registration.uniform_shirt_size,
      registration.uniform_scarf_needed,
      registration.parent_notified_status,
      registration.legacy_requested_programs,
      registration.import_notes,
      registration.notes,
      registration.created_at::text as created_at,
      registration.updated_at::text as updated_at
    from public.crm_student_registrations registration
    inner join public.crm_students student
      on student.id = registration.student_id
    inner join public.crm_registration_cycles cycle
      on cycle.id = registration.registration_cycle_id
    left join public.crm_families family
      on family.id = registration.family_id
    left join public.crm_division_levels division
      on division.id = registration.division_level_id
    left join public.crm_class_groups class_group
      on class_group.id = registration.class_group_id
    order by cycle.school_year_label desc, student.legal_last_name asc, student.legal_first_name asc
  `, [], accessContext);

  const registrationIds = registrationResult.rows.map((row) => row.id);
  const attachmentsByRegistration = new Map<string, CrmRegistrationAttachment[]>();

  if (registrationIds.length > 0) {
    const attachmentResult = await query<CrmRegistrationAttachmentRow>(
      `
        select
          id::text as id,
          student_registration_id::text as student_registration_id,
          label,
          attachment_url,
          storage_bucket,
          storage_path,
          notes,
          created_at::text as created_at,
          updated_at::text as updated_at
        from public.crm_registration_attachments
        where student_registration_id = any($1::uuid[])
        order by created_at asc, label asc
      `,
      [registrationIds],
      accessContext,
    );

    for (const attachmentRow of attachmentResult.rows) {
      const attachment = mapRegistrationAttachment(attachmentRow);
      const current = attachmentsByRegistration.get(attachmentRow.student_registration_id) ?? [];
      current.push(attachment);
      attachmentsByRegistration.set(attachmentRow.student_registration_id, current);
    }
  }

  return registrationResult.rows.map((row) =>
    mapStudentRegistration(row, attachmentsByRegistration.get(row.id) ?? []),
  );
}

export async function listRosterRecordsForAdmin(
  filters: CrmRosterFilters,
  accessContext: CrmDbAccessContext,
) {
  const result = await query<CrmRosterRow>(
    `
      select
        registration.id::text as id,
        registration.student_id::text as student_id,
        case
          when student.preferred_name is not null and student.preferred_name <> ''
            then student.preferred_name || ' (' || student.legal_first_name || ' ' || student.legal_last_name || ')'
          else student.legal_first_name || ' ' || student.legal_last_name
        end as student_name,
        registration.family_id::text as family_id,
        family.household_name as family_name,
        registration.registration_cycle_id::text as cycle_id,
        cycle.name as cycle_name,
        cycle.school_year_label as cycle_school_year_label,
        registration.division_level_id::text as division_id,
        division.code as division_code,
        division.label as division_label,
        registration.class_group_id::text as class_group_id,
        class_group.name as class_group_name,
        registration.team_name,
        registration.registration_status::text as registration_status,
        registration.certificate_status::text as certificate_status,
        registration.parent_notified_status,
        registration.intake_entered_at::text as intake_entered_at,
        registration.total_charged::text as total_charged,
        registration.total_paid::text as total_paid,
        primary_guardian.full_name as primary_guardian_name,
        primary_guardian.phone as primary_guardian_phone,
        primary_guardian.email as primary_guardian_email
      from public.crm_student_registrations registration
      inner join public.crm_students student
        on student.id = registration.student_id
      inner join public.crm_registration_cycles cycle
        on cycle.id = registration.registration_cycle_id
      left join public.crm_families family
        on family.id = registration.family_id
      left join public.crm_division_levels division
        on division.id = registration.division_level_id
      left join public.crm_class_groups class_group
        on class_group.id = registration.class_group_id
      left join lateral (
        select
          guardian.full_name,
          guardian.phone,
          guardian.email
        from public.crm_guardians guardian
        where guardian.family_id = registration.family_id
        order by guardian.is_primary_contact desc, guardian.sort_order asc, guardian.full_name asc
        limit 1
      ) primary_guardian on true
      where ($1::uuid is null or registration.registration_cycle_id = $1::uuid)
        and ($2::uuid is null or registration.division_level_id = $2::uuid)
        and ($3::uuid is null or registration.class_group_id = $3::uuid)
        and (
          $4::public.crm_registration_status is null
          or registration.registration_status = $4::public.crm_registration_status
        )
        and ($5::text is null or registration.team_name ilike '%' || $5 || '%')
      order by
        cycle.school_year_label desc,
        division.sort_order asc nulls last,
        class_group.sort_order asc nulls last,
        registration.team_name asc nulls last,
        student.legal_last_name asc,
        student.legal_first_name asc
    `,
    [
      filters.cycleId,
      filters.divisionId,
      filters.classGroupId,
      filters.registrationStatus,
      filters.team,
    ],
    accessContext,
  );

  return applyRosterAttentionFilter(result.rows.map(mapRosterRecord), filters.attention);
}
