"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  CRM_CERTIFICATE_STATUSES,
  CRM_MACRO_DIVISIONS,
  CRM_REGISTRATION_STATUSES,
} from "@/lib/crm";
import { getOptionalServerEnv, isDatabaseConfigured } from "@/lib/env";
import { getCheckedFormValue } from "@/lib/form-data";
import { requireMinimumRole } from "@/lib/auth/session";
import { withTransaction } from "@/server/db";

const registrationStatusSchema = z.enum(CRM_REGISTRATION_STATUSES);
const certificateStatusSchema = z.enum(CRM_CERTIFICATE_STATUSES);
const macroDivisionSchema = z.enum(CRM_MACRO_DIVISIONS);

function redirectWithMessage(path: string, key: "error" | "notice", message: string) {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function getTrimmedString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getTrimmedString(formData, key);
  return value.length > 0 ? value : null;
}

function getChecked(formData: FormData, key: string) {
  return getCheckedFormValue(formData, key);
}

function getSortOrder(formData: FormData, key: string) {
  const value = getTrimmedString(formData, key);
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "The requested CRM action could not be completed.";
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseOptionalMoney(formData: FormData, key: string) {
  const value = getTrimmedString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`"${key}" must be a valid non-negative amount.`);
  }

  return parsed;
}

function parseDateInput(formData: FormData, key: string) {
  const value = getTrimmedString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`"${key}" must use YYYY-MM-DD format.`);
  }

  return value;
}

function parseDateTimeInput(formData: FormData, key: string) {
  const value = getTrimmedString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`"${key}" must be a valid date and time.`);
  }

  return parsed.toISOString();
}

async function requireOperationsUser(path: string) {
  const access = await requireMinimumRole("operations", path);

  if (!access.authorized || access.reason !== "ok") {
    throw new Error("You do not have permission to manage CRM records.");
  }

  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before CRM records can be managed.");
  }

  return access.currentUser;
}

function revalidateCrmPaths(extraPaths: string[] = []) {
  const paths = new Set([
    "/admin",
    "/admin/families",
    "/admin/students",
    "/admin/divisions-classes",
    "/admin/registration-cycles",
    "/admin/exports",
    ...extraPaths,
  ]);

  for (const path of paths) {
    revalidatePath(path);
  }
}

type GuardianSlot = {
  email: string | null;
  fullName: string | null;
  id: string | null;
  notes: string | null;
  phone: string | null;
  relationshipLabel: string | null;
  sortOrder: number;
  wantsPrimary: boolean;
};

function readGuardianSlot(formData: FormData, index: 1 | 2): GuardianSlot {
  return {
    email: getOptionalString(formData, `guardian${index}Email`),
    fullName: getOptionalString(formData, `guardian${index}Name`),
    id: getOptionalString(formData, `guardian${index}Id`),
    notes: getOptionalString(formData, `guardian${index}Notes`),
    phone: getOptionalString(formData, `guardian${index}Phone`),
    relationshipLabel: getOptionalString(formData, `guardian${index}Relationship`),
    sortOrder: index,
    wantsPrimary: getChecked(formData, `guardian${index}Primary`),
  };
}

function slotHasValues(slot: GuardianSlot) {
  return Boolean(
    slot.fullName || slot.relationshipLabel || slot.phone || slot.email || slot.notes,
  );
}

async function syncGuardianSlots(
  client: Awaited<ReturnType<typeof withTransaction>> extends never ? never : Parameters<
    Parameters<typeof withTransaction>[0]
  >[0],
  familyId: string,
  slots: GuardianSlot[],
) {
  const savedGuardianIds: string[] = [];
  let preferredPrimaryGuardianId: string | null = null;

  for (const slot of slots) {
    if (!slotHasValues(slot)) {
      if (slot.id) {
        await client.query(
          `
            delete from public.crm_guardians
            where id = $1::uuid
              and family_id = $2::uuid
          `,
          [slot.id, familyId],
        );
      }

      continue;
    }

    if (!slot.fullName) {
      throw new Error("Guardian name is required once a guardian slot is used.");
    }

    const values = [
      familyId,
      slot.fullName,
      slot.relationshipLabel,
      slot.phone,
      slot.email,
      slot.sortOrder,
      slot.notes,
    ];

    const result = slot.id
      ? await client.query<{ id: string }>(
          `
            update public.crm_guardians
            set
              full_name = $2,
              relationship_label = $3,
              phone = $4,
              email = $5,
              sort_order = $6,
              notes = $7
            where id = $1::uuid
              and family_id = $8::uuid
            returning id::text as id
          `,
          [
            slot.id,
            slot.fullName,
            slot.relationshipLabel,
            slot.phone,
            slot.email,
            slot.sortOrder,
            slot.notes,
            familyId,
          ],
        )
      : await client.query<{ id: string }>(
          `
            insert into public.crm_guardians (
              family_id,
              full_name,
              relationship_label,
              phone,
              email,
              sort_order,
              notes
            )
            values ($1::uuid, $2, $3, $4, $5, $6, $7)
            returning id::text as id
          `,
          values,
        );

    const savedId = result.rows[0]?.id;

    if (!savedId) {
      throw new Error("Guardian record could not be saved.");
    }

    savedGuardianIds.push(savedId);

    if (slot.wantsPrimary && !preferredPrimaryGuardianId) {
      preferredPrimaryGuardianId = savedId;
    }
  }

  if (savedGuardianIds.length === 0) {
    return;
  }

  const primaryGuardianId = preferredPrimaryGuardianId ?? savedGuardianIds[0];

  await client.query(
    `
      update public.crm_guardians
      set is_primary_contact = (id = $2::uuid)
      where family_id = $1::uuid
    `,
    [familyId, primaryGuardianId],
  );
}

function parseAttachmentLines(formData: FormData) {
  const value = getTrimmedString(formData, "attachmentRefs");

  if (!value) {
    return [];
  }

  const { SUPABASE_PRIVATE_REGISTRATION_BUCKET } = getOptionalServerEnv();

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const pipeIndex = line.indexOf("|");
      const labelCandidate = pipeIndex >= 0 ? line.slice(0, pipeIndex).trim() : "";
      const referenceCandidate = pipeIndex >= 0 ? line.slice(pipeIndex + 1).trim() : line;
      const label =
        labelCandidate ||
        (referenceCandidate.startsWith("http://") || referenceCandidate.startsWith("https://")
          ? `Attachment ${index + 1}`
          : referenceCandidate.split("/").pop() || `Attachment ${index + 1}`);

      if (referenceCandidate.startsWith("http://") || referenceCandidate.startsWith("https://")) {
        return {
          attachmentUrl: referenceCandidate,
          label,
          notes: null,
          storageBucket: null,
          storagePath: null,
        };
      }

      return {
        attachmentUrl: null,
        label,
        notes: null,
        storageBucket: SUPABASE_PRIVATE_REGISTRATION_BUCKET,
        storagePath: referenceCandidate,
      };
    });
}

export async function saveFamilyAction(formData: FormData) {
  const redirectPath = "/admin/families";

  try {
    const currentUser = await requireOperationsUser(redirectPath);
    const id = getOptionalString(formData, "id");
    const householdName = getTrimmedString(formData, "householdName");

    if (!householdName) {
      throw new Error("Household label is required.");
    }

    await withTransaction(async (client) => {
      const familyValues = [
        householdName,
        getTrimmedString(formData, "homeAddress"),
        getOptionalString(formData, "emergencyContactName"),
        getOptionalString(formData, "emergencyContactRelationship"),
        getOptionalString(formData, "emergencyContactPhone"),
        getOptionalString(formData, "notes"),
        currentUser.id,
      ];

      const familyResult = id
        ? await client.query<{ id: string }>(
            `
              update public.crm_families
              set
                household_name = $2,
                home_address = $3,
                emergency_contact_name = $4,
                emergency_contact_relationship = $5,
                emergency_contact_phone = $6,
                notes = $7,
                updated_by = $8
              where id = $1::uuid
              returning id::text as id
            `,
            [id, ...familyValues],
          )
        : await client.query<{ id: string }>(
            `
              insert into public.crm_families (
                household_name,
                home_address,
                emergency_contact_name,
                emergency_contact_relationship,
                emergency_contact_phone,
                notes,
                created_by,
                updated_by
              )
              values ($1, $2, $3, $4, $5, $6, $7, $7)
              returning id::text as id
            `,
            familyValues,
          );

      const familyId = familyResult.rows[0]?.id;

      if (!familyId) {
        throw new Error("Family record could not be saved.");
      }

      await syncGuardianSlots(client, familyId, [
        readGuardianSlot(formData, 1),
        readGuardianSlot(formData, 2),
      ]);
    });

    revalidateCrmPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Family saved.");
}

export async function saveStudentAction(formData: FormData) {
  const redirectPath = "/admin/students";

  try {
    const currentUser = await requireOperationsUser(redirectPath);
    const id = getOptionalString(formData, "id");
    const familyId = getOptionalString(formData, "familyId");
    const legalFirstName = getTrimmedString(formData, "legalFirstName");
    const legalLastName = getTrimmedString(formData, "legalLastName");

    if (!familyId) {
      throw new Error("Select a family before saving a student.");
    }

    if (!legalFirstName || !legalLastName) {
      throw new Error("Student legal first and last name are required.");
    }

    await withTransaction(async (client) => {
      const studentValues = [
        familyId,
        legalFirstName,
        legalLastName,
        getOptionalString(formData, "preferredName"),
        getOptionalString(formData, "saintName"),
        parseDateInput(formData, "birthdate"),
        getOptionalString(formData, "genderValue"),
        getOptionalString(formData, "email"),
        getOptionalString(formData, "phone"),
        getOptionalString(formData, "healthSupportNotes"),
        formData.get("baptismCompleted") ? getChecked(formData, "baptismCompleted") : null,
        formData.get("firstCommunionCompleted")
          ? getChecked(formData, "firstCommunionCompleted")
          : null,
        formData.get("confirmationCompleted")
          ? getChecked(formData, "confirmationCompleted")
          : null,
        getOptionalString(formData, "notes"),
        currentUser.id,
      ];

      const studentResult = id
        ? await client.query<{ id: string }>(
            `
              update public.crm_students
              set
                family_id = $2::uuid,
                legal_first_name = $3,
                legal_last_name = $4,
                preferred_name = $5,
                saint_name = $6,
                birthdate = $7::date,
                gender_value = $8,
                email = $9,
                phone = $10,
                health_support_notes = $11,
                baptism_completed = $12,
                first_communion_completed = $13,
                confirmation_completed = $14,
                notes = $15,
                updated_by = $16
              where id = $1::uuid
              returning id::text as id
            `,
            [id, ...studentValues],
          )
        : await client.query<{ id: string }>(
            `
              insert into public.crm_students (
                family_id,
                legal_first_name,
                legal_last_name,
                preferred_name,
                saint_name,
                birthdate,
                gender_value,
                email,
                phone,
                health_support_notes,
                baptism_completed,
                first_communion_completed,
                confirmation_completed,
                notes,
                created_by,
                updated_by
              )
              values (
                $1::uuid,
                $2,
                $3,
                $4,
                $5,
                $6::date,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15,
                $15
              )
              returning id::text as id
            `,
            studentValues,
          );

      const studentId = studentResult.rows[0]?.id;

      if (!studentId) {
        throw new Error("Student record could not be saved.");
      }

      const guardianResult = await client.query<{
        id: string;
        is_primary_contact: boolean;
        relationship_label: string | null;
      }>(
        `
          select
            id::text as id,
            is_primary_contact,
            relationship_label
          from public.crm_guardians
          where family_id = $1::uuid
          order by is_primary_contact desc, sort_order asc, full_name asc
        `,
        [familyId],
      );

      await client.query(
        `
          delete from public.crm_student_guardians
          where student_id = $1::uuid
        `,
        [studentId],
      );

      for (const guardian of guardianResult.rows) {
        await client.query(
          `
            insert into public.crm_student_guardians (
              student_id,
              guardian_id,
              relationship_label,
              is_primary
            )
            values ($1::uuid, $2::uuid, $3, $4)
          `,
          [studentId, guardian.id, guardian.relationship_label, guardian.is_primary_contact],
        );
      }
    });

    revalidateCrmPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Student saved.");
}

export async function saveDivisionLevelAction(formData: FormData) {
  const redirectPath = "/admin/divisions-classes";

  try {
    const currentUser = await requireOperationsUser(redirectPath);
    const id = getOptionalString(formData, "id");
    const code = getTrimmedString(formData, "code").toUpperCase();
    const label = getTrimmedString(formData, "label");

    if (!code || !label) {
      throw new Error("Division code and label are required.");
    }

    const values = [
      code,
      label,
      macroDivisionSchema.parse(getTrimmedString(formData, "macroDivision")),
      getSortOrder(formData, "sortOrder"),
      getChecked(formData, "isActive"),
      getOptionalString(formData, "notes"),
      currentUser.id,
    ];

    await withTransaction(async (client) => {
      if (id) {
        await client.query(
          `
            update public.crm_division_levels
            set
              code = $2,
              label = $3,
              macro_division = $4::public.crm_macro_division,
              sort_order = $5,
              is_active = $6,
              notes = $7,
              updated_by = $8
            where id = $1::uuid
          `,
          [id, ...values],
        );
      } else {
        await client.query(
          `
            insert into public.crm_division_levels (
              code,
              label,
              macro_division,
              sort_order,
              is_active,
              notes,
              created_by,
              updated_by
            )
            values ($1, $2, $3::public.crm_macro_division, $4, $5, $6, $7, $7)
          `,
          values,
        );
      }
    });

    revalidateCrmPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Division saved.");
}

export async function saveClassGroupAction(formData: FormData) {
  const redirectPath = "/admin/divisions-classes";

  try {
    const currentUser = await requireOperationsUser(redirectPath);
    const id = getOptionalString(formData, "id");
    const name = getTrimmedString(formData, "name");
    const slug = normalizeSlug(getTrimmedString(formData, "slug") || name);

    if (!name || !slug) {
      throw new Error("Class name is required.");
    }

    const values = [
      slug,
      name,
      getOptionalString(formData, "defaultDivisionId"),
      getSortOrder(formData, "sortOrder"),
      getChecked(formData, "isActive"),
      getOptionalString(formData, "notes"),
      currentUser.id,
    ];

    await withTransaction(async (client) => {
      if (id) {
        await client.query(
          `
            update public.crm_class_groups
            set
              slug = $2,
              name = $3,
              default_division_id = $4::uuid,
              sort_order = $5,
              is_active = $6,
              notes = $7,
              updated_by = $8
            where id = $1::uuid
          `,
          [id, ...values],
        );
      } else {
        await client.query(
          `
            insert into public.crm_class_groups (
              slug,
              name,
              default_division_id,
              sort_order,
              is_active,
              notes,
              created_by,
              updated_by
            )
            values ($1, $2, $3::uuid, $4, $5, $6, $7, $7)
          `,
          values,
        );
      }
    });

    revalidateCrmPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Class group saved.");
}

export async function saveRegistrationCycleAction(formData: FormData) {
  const redirectPath = "/admin/registration-cycles";

  try {
    const currentUser = await requireOperationsUser(redirectPath);
    const id = getOptionalString(formData, "id");
    const schoolYearLabel = getTrimmedString(formData, "schoolYearLabel");
    const name = getTrimmedString(formData, "name");
    const slug = normalizeSlug(getTrimmedString(formData, "slug") || schoolYearLabel || name);
    const isActive = getChecked(formData, "isActive");

    if (!schoolYearLabel || !name || !slug) {
      throw new Error("Cycle name and school-year label are required.");
    }

    await withTransaction(async (client) => {
      if (isActive) {
        await client.query(
          `
            update public.crm_registration_cycles
            set is_active = false
            where is_active = true
              and ($1::uuid is null or id <> $1::uuid)
          `,
          [id],
        );
      }

      const values = [
        slug,
        name,
        schoolYearLabel,
        parseDateInput(formData, "startsOn"),
        parseDateInput(formData, "endsOn"),
        isActive,
        getOptionalString(formData, "notes"),
        currentUser.id,
      ];

      if (id) {
        await client.query(
          `
            update public.crm_registration_cycles
            set
              slug = $2,
              name = $3,
              school_year_label = $4,
              starts_on = $5::date,
              ends_on = $6::date,
              is_active = $7,
              notes = $8,
              updated_by = $9
            where id = $1::uuid
          `,
          [id, ...values],
        );
      } else {
        await client.query(
          `
            insert into public.crm_registration_cycles (
              slug,
              name,
              school_year_label,
              starts_on,
              ends_on,
              is_active,
              notes,
              created_by,
              updated_by
            )
            values ($1, $2, $3, $4::date, $5::date, $6, $7, $8, $8)
          `,
          values,
        );
      }
    });

    revalidateCrmPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Registration cycle saved.");
}

export async function saveStudentRegistrationAction(formData: FormData) {
  const redirectPath = "/admin/students";

  try {
    const currentUser = await requireOperationsUser(redirectPath);
    const id = getOptionalString(formData, "id");
    const studentId = getOptionalString(formData, "studentId");
    const registrationCycleId = getOptionalString(formData, "registrationCycleId");

    if (!studentId || !registrationCycleId) {
      throw new Error("Student and registration cycle are required.");
    }

    await withTransaction(async (client) => {
      const studentLookup = await client.query<{ family_id: string | null }>(
        `
          select family_id::text as family_id
          from public.crm_students
          where id = $1::uuid
          limit 1
        `,
        [studentId],
      );

      if (studentLookup.rowCount === 0) {
        throw new Error("Selected student could not be found.");
      }

      const familyId = studentLookup.rows[0]?.family_id ?? null;
      const values = [
        studentId,
        familyId,
        registrationCycleId,
        getOptionalString(formData, "divisionLevelId"),
        getOptionalString(formData, "classGroupId"),
        registrationStatusSchema.parse(
          getTrimmedString(formData, "registrationStatus") || "draft",
        ),
        getOptionalString(formData, "teamName"),
        parseDateTimeInput(formData, "intakeEnteredAt"),
        formData.get("isReturningStudent")
          ? getChecked(formData, "isReturningStudent")
          : null,
        certificateStatusSchema.parse(
          getTrimmedString(formData, "certificateStatus") || "unknown",
        ),
        getOptionalString(formData, "certificateNotes"),
        parseOptionalMoney(formData, "totalCharged"),
        parseOptionalMoney(formData, "totalPaid"),
        getOptionalString(formData, "uniformShirtSize"),
        formData.get("uniformScarfNeeded")
          ? getChecked(formData, "uniformScarfNeeded")
          : null,
        getOptionalString(formData, "parentNotifiedStatus"),
        getOptionalString(formData, "legacyRequestedPrograms"),
        getOptionalString(formData, "importNotes"),
        getOptionalString(formData, "notes"),
        currentUser.id,
      ];

      const registrationResult = id
        ? await client.query<{ id: string }>(
            `
              update public.crm_student_registrations
              set
                student_id = $2::uuid,
                family_id = $3::uuid,
                registration_cycle_id = $4::uuid,
                division_level_id = $5::uuid,
                class_group_id = $6::uuid,
                registration_status = $7::public.crm_registration_status,
                team_name = $8,
                intake_entered_at = $9::timestamptz,
                is_returning_student = $10,
                certificate_status = $11::public.crm_certificate_status,
                certificate_notes = $12,
                total_charged = $13,
                total_paid = $14,
                uniform_shirt_size = $15,
                uniform_scarf_needed = $16,
                parent_notified_status = $17,
                legacy_requested_programs = $18,
                import_notes = $19,
                notes = $20,
                updated_by = $21
              where id = $1::uuid
              returning id::text as id
            `,
            [id, ...values],
          )
        : await client.query<{ id: string }>(
            `
              insert into public.crm_student_registrations (
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
                notes,
                created_by,
                updated_by
              )
              values (
                $1::uuid,
                $2::uuid,
                $3::uuid,
                $4::uuid,
                $5::uuid,
                $6::public.crm_registration_status,
                $7,
                $8::timestamptz,
                $9,
                $10::public.crm_certificate_status,
                $11,
                $12,
                $13,
                $14,
                $15,
                $16,
                $17,
                $18,
                $19,
                $20,
                $20
              )
              returning id::text as id
            `,
            values,
          );

      const registrationId = registrationResult.rows[0]?.id;

      if (!registrationId) {
        throw new Error("Registration record could not be saved.");
      }

      await client.query(
        `
          delete from public.crm_registration_attachments
          where student_registration_id = $1::uuid
        `,
        [registrationId],
      );

      for (const attachment of parseAttachmentLines(formData)) {
        await client.query(
          `
            insert into public.crm_registration_attachments (
              student_registration_id,
              label,
              attachment_url,
              storage_bucket,
              storage_path,
              notes,
              created_by,
              updated_by
            )
            values ($1::uuid, $2, $3, $4, $5, $6, $7, $7)
          `,
          [
            registrationId,
            attachment.label,
            attachment.attachmentUrl,
            attachment.storageBucket,
            attachment.storagePath,
            attachment.notes,
            currentUser.id,
          ],
        );
      }
    });

    revalidateCrmPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Registration saved.");
}
