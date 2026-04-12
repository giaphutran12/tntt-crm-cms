import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import {
  CRM_CERTIFICATE_STATUSES,
  CRM_MACRO_DIVISIONS,
  CRM_ROSTER_ATTENTION_FILTERS,
  CRM_REGISTRATION_STATUSES,
  applyDefaultRosterCycle,
  formatCrmEnumLabel,
  listClassGroupsForAdmin,
  listDivisionLevelsForAdmin,
  listFamiliesForAdmin,
  listRegistrationCyclesForAdmin,
  listRosterRecordsForAdmin,
  listStudentRegistrationsForAdmin,
  listStudentsForAdmin,
  parseCrmRosterFilters,
  type CrmClassGroup,
  type CrmDivisionLevel,
  type CrmFamily,
  type CrmRegistrationCycle,
  type CrmRosterFilters,
  type CrmRosterRecord,
  type CrmStudent,
  type CrmStudentRegistration,
} from "@/lib/crm";
import { isDatabaseConfigured } from "@/lib/env";
import {
  saveClassGroupAction,
  saveDivisionLevelAction,
  saveFamilyAction,
  saveRegistrationCycleAction,
  saveStudentAction,
  saveStudentRegistrationAction,
} from "@/app/admin/crm-actions";

type SearchParamValue = string | string[] | undefined;

type SectionSearchParams = Record<string, SearchParamValue> & {
  attention?: SearchParamValue;
  classGroupId?: SearchParamValue;
  cycleId?: SearchParamValue;
  divisionId?: SearchParamValue;
  error?: SearchParamValue;
  notice?: SearchParamValue;
  registrationStatus?: SearchParamValue;
  team?: SearchParamValue;
};

function getSearchParamValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function NoticeBanner({ error, notice }: SectionSearchParams) {
  const resolvedError = getSearchParamValue(error);
  const resolvedNotice = getSearchParamValue(notice);

  if (!resolvedError && !resolvedNotice) {
    return null;
  }

  const tone = resolvedError
    ? "border-[rgba(164,61,47,0.28)] bg-[rgba(164,61,47,0.08)] text-[var(--accent-strong)]"
    : "border-[rgba(32,68,58,0.18)] bg-[rgba(32,68,58,0.08)] text-[var(--forest)]";

  return (
    <div className={`rounded-[1.5rem] border px-5 py-4 text-sm font-medium ${tone}`}>
      {resolvedError ?? resolvedNotice}
    </div>
  );
}

function DatabaseRequiredPanel() {
  return (
    <section className="panel rounded-[2rem] px-6 py-8 md:px-8">
      <p className="eyebrow mb-3">CRM unavailable</p>
      <h2 className="display-title text-3xl font-semibold text-[var(--forest)]">
        The records workspace needs a live Postgres connection.
      </h2>
      <p className="muted mt-4 max-w-3xl text-base md:text-lg">
        The admin shell is rendered, but `DATABASE_URL` is missing in this environment,
        so family, student, division, and registration records cannot be loaded or saved yet.
      </p>
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="display-title text-3xl font-semibold text-[var(--forest)] md:text-4xl">
        {title}
      </h2>
      <p className="muted mt-4 max-w-3xl text-base md:text-lg">{description}</p>
    </div>
  );
}

function Field({
  children,
  hint,
  label,
}: {
  children: ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-[1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(164,61,47,0.38)] focus:ring-2 focus:ring-[rgba(164,61,47,0.12)] ${props.className ?? ""}`}
    />
  );
}

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[7rem] w-full rounded-[1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(164,61,47,0.38)] focus:ring-2 focus:ring-[rgba(164,61,47,0.12)] ${props.className ?? ""}`}
    />
  );
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-[1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(164,61,47,0.38)] focus:ring-2 focus:ring-[rgba(164,61,47,0.12)] ${props.className ?? ""}`}
    />
  );
}

function Toggle({
  checkedValue = true,
  defaultChecked,
  label,
  name,
  withHiddenFalse = false,
}: {
  checkedValue?: string | boolean;
  defaultChecked?: boolean;
  label: string;
  name: string;
  withHiddenFalse?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-3 rounded-[1rem] border border-[var(--line)] bg-white/78 px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
      {withHiddenFalse ? <input name={name} type="hidden" value="0" /> : null}
      <input defaultChecked={defaultChecked} name={name} type="checkbox" value={String(checkedValue)} />
      <span>{label}</span>
    </label>
  );
}

function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white/65 px-5 py-6 text-sm text-[var(--muted)]">
      <p className="font-semibold text-[var(--forest)]">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not set";
  }

  try {
    return new Intl.DateTimeFormat("en-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatMoney(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const amount = Number.parseFloat(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-CA", {
    currency: "CAD",
    style: "currency",
  }).format(amount);
}

function buildRosterQueryString(filters: CrmRosterFilters) {
  const params = new URLSearchParams();

  if (filters.cycleId) {
    params.set("cycleId", filters.cycleId);
  }

  if (filters.divisionId) {
    params.set("divisionId", filters.divisionId);
  }

  if (filters.classGroupId) {
    params.set("classGroupId", filters.classGroupId);
  }

  if (filters.registrationStatus) {
    params.set("registrationStatus", filters.registrationStatus);
  }

  if (filters.team) {
    params.set("team", filters.team);
  }

  if (filters.attention !== "all") {
    params.set("attention", filters.attention);
  }

  return params.toString();
}

function getRosterCycleLabel(cycleId: string | null, cycles: CrmRegistrationCycle[]) {
  if (!cycleId) {
    return "All cycles";
  }

  const cycle = cycles.find((item) => item.id === cycleId);
  return cycle ? `${cycle.schoolYearLabel} • ${cycle.name}` : "Selected cycle";
}

function SummaryCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-5 py-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className="text-3xl font-semibold text-[var(--forest)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function RosterAttentionBadge({ record }: { record: CrmRosterRecord }) {
  if (!record.needsAttention) {
    return (
      <span className="inline-flex rounded-full border border-[rgba(32,68,58,0.16)] bg-[rgba(32,68,58,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
        Ready
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-[rgba(164,61,47,0.2)] bg-[rgba(164,61,47,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
      Needs follow-up
    </span>
  );
}

function RelationshipSummary({ family }: { family: CrmFamily }) {
  if (family.guardians.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No guardians recorded yet.</p>;
  }

  return (
    <div className="space-y-2 text-sm text-[var(--muted)]">
      {family.guardians.map((guardian) => (
        <p key={guardian.id}>
          <span className="font-semibold text-[var(--foreground)]">{guardian.fullName}</span>
          {guardian.relationshipLabel ? ` • ${guardian.relationshipLabel}` : ""}
          {guardian.isPrimaryContact ? " • primary contact" : ""}
        </p>
      ))}
    </div>
  );
}

function FamilyForm({ family }: { family?: CrmFamily }) {
  const guardian1 = family?.guardians[0];
  const guardian2 = family?.guardians[1];

  return (
    <form action={saveFamilyAction} className="grid gap-4">
      <input defaultValue={family?.id ?? ""} name="id" type="hidden" />
      <input defaultValue={guardian1?.id ?? ""} name="guardian1Id" type="hidden" />
      <input defaultValue={guardian2?.id ?? ""} name="guardian2Id" type="hidden" />

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Field label="Household label" hint="Internal label such as Nguyen family or Tran household.">
          <TextInput defaultValue={family?.householdName ?? ""} name="householdName" required />
        </Field>
        <Field label="Home address">
          <TextInput defaultValue={family?.homeAddress ?? ""} name="homeAddress" />
        </Field>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-[var(--line)] bg-white/74 px-5 py-5">
        <div>
          <p className="font-semibold text-[var(--foreground)]">Guardian slot 1</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Leave the slot empty if the family only has one guardian contact.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Guardian name">
            <TextInput defaultValue={guardian1?.fullName ?? ""} name="guardian1Name" />
          </Field>
          <Field label="Relationship">
            <TextInput defaultValue={guardian1?.relationshipLabel ?? ""} name="guardian1Relationship" placeholder="Parent / Guardian" />
          </Field>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Phone">
            <TextInput defaultValue={guardian1?.phone ?? ""} name="guardian1Phone" />
          </Field>
          <Field label="Email">
            <TextInput defaultValue={guardian1?.email ?? ""} name="guardian1Email" type="email" />
          </Field>
        </div>
        <Field label="Guardian notes">
          <Textarea defaultValue={guardian1?.notes ?? ""} name="guardian1Notes" />
        </Field>
        <Toggle defaultChecked={guardian1?.isPrimaryContact ?? !guardian2} label="Use as primary contact" name="guardian1Primary" />
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-[var(--line)] bg-white/74 px-5 py-5">
        <div>
          <p className="font-semibold text-[var(--foreground)]">Guardian slot 2</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Useful for the common parent-1 / parent-2 paper form pattern.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Guardian name">
            <TextInput defaultValue={guardian2?.fullName ?? ""} name="guardian2Name" />
          </Field>
          <Field label="Relationship">
            <TextInput defaultValue={guardian2?.relationshipLabel ?? ""} name="guardian2Relationship" placeholder="Parent / Guardian" />
          </Field>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Phone">
            <TextInput defaultValue={guardian2?.phone ?? ""} name="guardian2Phone" />
          </Field>
          <Field label="Email">
            <TextInput defaultValue={guardian2?.email ?? ""} name="guardian2Email" type="email" />
          </Field>
        </div>
        <Field label="Guardian notes">
          <Textarea defaultValue={guardian2?.notes ?? ""} name="guardian2Notes" />
        </Field>
        <Toggle defaultChecked={guardian2?.isPrimaryContact} label="Use as primary contact" name="guardian2Primary" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Emergency contact name">
          <TextInput defaultValue={family?.emergencyContactName ?? ""} name="emergencyContactName" />
        </Field>
        <Field label="Emergency contact phone">
          <TextInput defaultValue={family?.emergencyContactPhone ?? ""} name="emergencyContactPhone" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <Field label="Emergency contact relationship">
          <TextInput defaultValue={family?.emergencyContactRelationship ?? ""} name="emergencyContactRelationship" />
        </Field>
        <Field label="Family notes">
          <Textarea defaultValue={family?.notes ?? ""} name="notes" />
        </Field>
      </div>

      <div>
        <button className="button-primary" type="submit">
          Save family
        </button>
      </div>
    </form>
  );
}

function StudentForm({
  families,
  student,
}: {
  families: CrmFamily[];
  student?: CrmStudent;
}) {
  return (
    <form action={saveStudentAction} className="grid gap-4">
      <input defaultValue={student?.id ?? ""} name="id" type="hidden" />

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr_1fr]">
        <Field label="Family">
          <Select defaultValue={student?.familyId ?? ""} name="familyId" required>
            <option value="">Select a family</option>
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.householdName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Legal first name">
          <TextInput defaultValue={student?.legalFirstName ?? ""} name="legalFirstName" required />
        </Field>
        <Field label="Legal last name">
          <TextInput defaultValue={student?.legalLastName ?? ""} name="legalLastName" required />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Preferred name">
          <TextInput defaultValue={student?.preferredName ?? ""} name="preferredName" />
        </Field>
        <Field label="Saint name">
          <TextInput defaultValue={student?.saintName ?? ""} name="saintName" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr_1fr]">
        <Field label="Birthdate">
          <TextInput defaultValue={formatDateInput(student?.birthdate ?? null)} name="birthdate" type="date" />
        </Field>
        <Field label="Gender value">
          <TextInput defaultValue={student?.genderValue ?? ""} name="genderValue" placeholder="Male / Female / collected value" />
        </Field>
        <Field label="Student email">
          <TextInput defaultValue={student?.email ?? ""} name="email" type="email" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Student phone">
          <TextInput defaultValue={student?.phone ?? ""} name="phone" />
        </Field>
        <Field label="Health / support notes">
          <Textarea defaultValue={student?.healthSupportNotes ?? ""} name="healthSupportNotes" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-3">
        <Toggle defaultChecked={student?.baptismCompleted ?? false} label="Baptism completed" name="baptismCompleted" withHiddenFalse />
        <Toggle defaultChecked={student?.firstCommunionCompleted ?? false} label="First Communion completed" name="firstCommunionCompleted" withHiddenFalse />
        <Toggle defaultChecked={student?.confirmationCompleted ?? false} label="Confirmation completed" name="confirmationCompleted" withHiddenFalse />
      </div>

      <Field label="Student notes">
        <Textarea defaultValue={student?.notes ?? ""} name="notes" />
      </Field>

      <div>
        <button className="button-primary" type="submit">
          Save student
        </button>
      </div>
    </form>
  );
}

function RegistrationForm({
  classGroups,
  cycles,
  divisions,
  registration,
  students,
}: {
  classGroups: CrmClassGroup[];
  cycles: CrmRegistrationCycle[];
  divisions: CrmDivisionLevel[];
  registration?: CrmStudentRegistration;
  students: CrmStudent[];
}) {
  return (
    <form action={saveStudentRegistrationAction} className="grid gap-4">
      <input defaultValue={registration?.id ?? ""} name="id" type="hidden" />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Field label="Student">
          <Select defaultValue={registration?.studentId ?? ""} name="studentId" required>
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Registration cycle">
          <Select defaultValue={registration?.registrationCycleId ?? ""} name="registrationCycleId" required>
            <option value="">Select a cycle</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.schoolYearLabel}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Field label="Division">
          <Select defaultValue={registration?.divisionId ?? ""} name="divisionLevelId">
            <option value="">Unassigned</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.code} • {division.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Class / homeroom">
          <Select defaultValue={registration?.classGroupId ?? ""} name="classGroupId">
            <option value="">Unassigned</option>
            {classGroups.map((classGroup) => (
              <option key={classGroup.id} value={classGroup.id}>
                {classGroup.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Team">
          <TextInput defaultValue={registration?.teamName ?? ""} name="teamName" placeholder="Team 1 / Blue team" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr_1fr]">
        <Field label="Registration status">
          <Select defaultValue={registration?.registrationStatus ?? "draft"} name="registrationStatus">
            {CRM_REGISTRATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Intake entered at">
          <TextInput defaultValue={formatDateTimeLocal(registration?.intakeEnteredAt ?? null)} name="intakeEnteredAt" type="datetime-local" />
        </Field>
        <Field label="Parent follow-up status">
          <TextInput defaultValue={registration?.parentNotifiedStatus ?? ""} name="parentNotifiedStatus" placeholder="Sent / pending / call back" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
        <Field label="Certificate status">
          <Select defaultValue={registration?.certificateStatus ?? "unknown"} name="certificateStatus">
            {CRM_CERTIFICATE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Certificate notes">
          <Textarea defaultValue={registration?.certificateNotes ?? ""} name="certificateNotes" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Total charged">
          <TextInput defaultValue={registration?.totalCharged ?? ""} min="0" name="totalCharged" step="0.01" type="number" />
        </Field>
        <Field label="Total paid">
          <TextInput defaultValue={registration?.totalPaid ?? ""} min="0" name="totalPaid" step="0.01" type="number" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-3">
        <Toggle defaultChecked={registration?.isReturningStudent ?? false} label="Returning student" name="isReturningStudent" withHiddenFalse />
        <Toggle defaultChecked={registration?.uniformScarfNeeded ?? false} label="Uniform scarf needed" name="uniformScarfNeeded" withHiddenFalse />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Uniform shirt size">
          <TextInput defaultValue={registration?.uniformShirtSize ?? ""} name="uniformShirtSize" placeholder="XS / S / M / L / XL / None" />
        </Field>
        <Field label="Requested programs (legacy/raw)">
          <TextInput defaultValue={registration?.legacyRequestedPrograms ?? ""} name="legacyRequestedPrograms" placeholder="Registration for __ value from paper form if needed" />
        </Field>
      </div>

      <Field
        label="Attachment references"
        hint="One per line using `Label | https://...` or `Label | private/forms/scan.pdf`."
      >
        <Textarea
          defaultValue={
            registration?.attachments
              .map((attachment) => `${attachment.label} | ${attachment.displayReference}`)
              .join("\n") ?? ""
          }
          name="attachmentRefs"
        />
      </Field>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Import / legacy notes">
          <Textarea defaultValue={registration?.importNotes ?? ""} name="importNotes" />
        </Field>
        <Field label="Registration notes">
          <Textarea defaultValue={registration?.notes ?? ""} name="notes" />
        </Field>
      </div>

      <div>
        <button className="button-primary" type="submit">
          Save registration
        </button>
      </div>
    </form>
  );
}

function DivisionForm({ division }: { division?: CrmDivisionLevel }) {
  return (
    <form action={saveDivisionLevelAction} className="grid gap-4">
      <input defaultValue={division?.id ?? ""} name="id" type="hidden" />
      <div className="grid gap-4 lg:grid-cols-[0.4fr_0.6fr_0.7fr]">
        <Field label="Code">
          <TextInput defaultValue={division?.code ?? ""} name="code" placeholder="AN1" required />
        </Field>
        <Field label="Label">
          <TextInput defaultValue={division?.label ?? ""} name="label" placeholder="Au Nhi 1" required />
        </Field>
        <Field label="Macro division">
          <Select defaultValue={division?.macroDivision ?? "au_nhi"} name="macroDivision">
            {CRM_MACRO_DIVISIONS.map((macroDivision) => (
              <option key={macroDivision} value={macroDivision}>
                {macroDivision.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.35fr_0.65fr]">
        <Field label="Sort order">
          <TextInput defaultValue={division?.sortOrder ?? 0} name="sortOrder" type="number" />
        </Field>
        <Field label="Notes">
          <Textarea defaultValue={division?.notes ?? ""} name="notes" />
        </Field>
      </div>

      <Toggle defaultChecked={division?.isActive ?? true} label="Division is active" name="isActive" />

      <div>
        <button className="button-primary" type="submit">
          Save division
        </button>
      </div>
    </form>
  );
}

function ClassGroupForm({
  classGroup,
  divisions,
}: {
  classGroup?: CrmClassGroup;
  divisions: CrmDivisionLevel[];
}) {
  return (
    <form action={saveClassGroupAction} className="grid gap-4">
      <input defaultValue={classGroup?.id ?? ""} name="id" type="hidden" />
      <div className="grid gap-4 lg:grid-cols-[0.65fr_0.35fr]">
        <Field label="Class name">
          <TextInput defaultValue={classGroup?.name ?? ""} name="name" placeholder="Vỡ Lòng" required />
        </Field>
        <Field label="Slug">
          <TextInput defaultValue={classGroup?.slug ?? ""} name="slug" placeholder="vo-long" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.55fr_0.2fr_0.25fr]">
        <Field label="Default division">
          <Select defaultValue={classGroup?.defaultDivisionId ?? ""} name="defaultDivisionId">
            <option value="">No default division</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.code} • {division.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sort order">
          <TextInput defaultValue={classGroup?.sortOrder ?? 0} name="sortOrder" type="number" />
        </Field>
        <div className="flex items-end">
          <Toggle defaultChecked={classGroup?.isActive ?? true} label="Active" name="isActive" />
        </div>
      </div>

      <Field label="Notes">
        <Textarea defaultValue={classGroup?.notes ?? ""} name="notes" />
      </Field>

      <div>
        <button className="button-primary" type="submit">
          Save class group
        </button>
      </div>
    </form>
  );
}

function RegistrationCycleForm({ cycle }: { cycle?: CrmRegistrationCycle }) {
  return (
    <form action={saveRegistrationCycleAction} className="grid gap-4">
      <input defaultValue={cycle?.id ?? ""} name="id" type="hidden" />
      <div className="grid gap-4 lg:grid-cols-[0.55fr_0.45fr]">
        <Field label="Cycle name">
          <TextInput defaultValue={cycle?.name ?? ""} name="name" placeholder="2026-2027 Registration" required />
        </Field>
        <Field label="School-year label">
          <TextInput defaultValue={cycle?.schoolYearLabel ?? ""} name="schoolYearLabel" placeholder="2026-2027" required />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.45fr_0.275fr_0.275fr]">
        <Field label="Slug">
          <TextInput defaultValue={cycle?.slug ?? ""} name="slug" placeholder="2026-2027" />
        </Field>
        <Field label="Starts on">
          <TextInput defaultValue={formatDateInput(cycle?.startsOn ?? null)} name="startsOn" type="date" />
        </Field>
        <Field label="Ends on">
          <TextInput defaultValue={formatDateInput(cycle?.endsOn ?? null)} name="endsOn" type="date" />
        </Field>
      </div>

      <Field label="Notes">
        <Textarea defaultValue={cycle?.notes ?? ""} name="notes" />
      </Field>

      <Toggle defaultChecked={cycle?.isActive ?? false} label="Set as active cycle" name="isActive" />

      <div>
        <button className="button-primary" type="submit">
          Save cycle
        </button>
      </div>
    </form>
  );
}

export async function CrmSectionContent({
  searchParams,
  section,
}: {
  searchParams: SectionSearchParams;
  section: string;
}) {
  if (!isDatabaseConfigured()) {
    return (
      <section className="space-y-6">
        <NoticeBanner {...searchParams} />
        <DatabaseRequiredPanel />
      </section>
    );
  }

  switch (section) {
    case "families":
      return <FamiliesSection searchParams={searchParams} />;
    case "students":
      return <StudentsSection searchParams={searchParams} />;
    case "divisions-classes":
      return <DivisionsClassesSection searchParams={searchParams} />;
    case "registration-cycles":
      return <RegistrationCyclesSection searchParams={searchParams} />;
    case "exports":
      return <ExportsSection searchParams={searchParams} />;
    default:
      return null;
  }
}

async function FamiliesSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const families = await listFamiliesForAdmin();

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Families"
        title="Capture household context before student-by-student entry."
        description="This is the paper-registration starting point: create the household, store guardian contacts, and keep the emergency contact data attached to the family record instead of scattering it across rows."
      />

      <div className="panel rounded-[1.75rem] px-5 py-6">
        <p className="eyebrow mb-3">Create family</p>
        <FamilyForm />
      </div>

      <div className="space-y-4">
        {families.length === 0 ? (
          <EmptyState
            title="No family records yet"
            description="Create the first household above, then start attaching students and yearly registrations to it."
          />
        ) : (
          families.map((family) => (
            <details key={family.id} className="panel rounded-[1.75rem] px-5 py-6">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">{family.householdName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {family.studentCount} students • {family.guardians.length} guardians
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Updated {formatTimestamp(family.updatedAt)}
                  </div>
                </div>
              </summary>
              <div className="mt-5 grid gap-5 lg:grid-cols-[0.78fr_0.22fr]">
                <FamilyForm family={family} />
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/76 p-5">
                  <p className="eyebrow mb-2">Current contacts</p>
                  <RelationshipSummary family={family} />
                  <p className="mt-5 text-sm text-[var(--muted)]">
                    Emergency contact:{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {family.emergencyContactName ?? "Not set"}
                    </span>
                  </p>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

async function StudentsSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const [families, students, divisions, classGroups, cycles, registrations] = await Promise.all([
    listFamiliesForAdmin(),
    listStudentsForAdmin(),
    listDivisionLevelsForAdmin(),
    listClassGroupsForAdmin(),
    listRegistrationCyclesForAdmin(),
    listStudentRegistrationsForAdmin(),
  ]);

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Students"
        title="Manage student profiles and yearly registration records together."
        description="Student identity stays separate from the yearly registration row. That keeps roster placement, status, certificate follow-up, payment totals, and attachment references tied to the correct cycle."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel rounded-[1.75rem] px-5 py-6">
          <p className="eyebrow mb-3">Create student</p>
          <StudentForm families={families} />
        </div>

        <div className="panel rounded-[1.75rem] px-5 py-6">
          <p className="eyebrow mb-3">Create registration</p>
          <RegistrationForm classGroups={classGroups} cycles={cycles} divisions={divisions} students={students} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-[var(--forest)]">Student records</h3>
          <p className="text-sm text-[var(--muted)]">{students.length} total students</p>
        </div>

        {students.length === 0 ? (
          <EmptyState
            title="No student records yet"
            description="Create a family first, then enter the student profile. Registrations can be added as each paper form is processed."
          />
        ) : (
          students.map((student) => (
            <details key={student.id} className="panel rounded-[1.75rem] px-5 py-6">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">{student.fullName}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {student.familyName ?? "No family linked"} • {student.registrationCount} yearly registrations
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Updated {formatTimestamp(student.updatedAt)}
                  </div>
                </div>
              </summary>
              <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_0.2fr]">
                <StudentForm families={families} student={student} />
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/76 p-5">
                  <p className="eyebrow mb-2">Guardian links</p>
                  {student.guardians.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Link guardians by assigning the student to a family with saved guardian contacts.</p>
                  ) : (
                    <div className="space-y-2 text-sm text-[var(--muted)]">
                      {student.guardians.map((guardian) => (
                        <p key={guardian.id}>
                          <span className="font-semibold text-[var(--foreground)]">{guardian.fullName}</span>
                          {guardian.relationshipLabel ? ` • ${guardian.relationshipLabel}` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </details>
          ))
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-[var(--forest)]">Yearly registrations</h3>
          <p className="text-sm text-[var(--muted)]">{registrations.length} total records</p>
        </div>

        {registrations.length === 0 ? (
          <EmptyState
            title="No registration records yet"
            description="Use the registration form above to record the paper intake status, placement, payment, and certificate follow-up for a specific cycle."
          />
        ) : (
          registrations.map((registration) => (
            <details key={registration.id} className="panel rounded-[1.75rem] px-5 py-6">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      {registration.studentName} • {registration.cycleSchoolYearLabel}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {registration.registrationStatus.replaceAll("_", " ")}
                      {registration.divisionCode ? ` • ${registration.divisionCode}` : ""}
                      {registration.classGroupName ? ` • ${registration.classGroupName}` : ""}
                      {registration.teamName ? ` • ${registration.teamName}` : ""}
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {formatMoney(registration.totalPaid)} paid
                  </div>
                </div>
              </summary>
              <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_0.2fr]">
                <RegistrationForm
                  classGroups={classGroups}
                  cycles={cycles}
                  divisions={divisions}
                  registration={registration}
                  students={students}
                />
                <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/76 p-5 text-sm text-[var(--muted)]">
                  <p className="eyebrow mb-2">Current summary</p>
                  <p>
                    Charged: <span className="font-semibold text-[var(--foreground)]">{formatMoney(registration.totalCharged)}</span>
                  </p>
                  <p className="mt-2">
                    Certificate:{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {registration.certificateStatus.replaceAll("_", " ")}
                    </span>
                  </p>
                  <p className="mt-2">
                    Attachments:{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {registration.attachments.length}
                    </span>
                  </p>
                  <p className="mt-2">
                    Entered at:{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {formatTimestamp(registration.intakeEnteredAt)}
                    </span>
                  </p>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

async function DivisionsClassesSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const [divisions, classGroups] = await Promise.all([
    listDivisionLevelsForAdmin(),
    listClassGroupsForAdmin(),
  ]);

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Divisions / Classes"
        title="Keep TNTT division codes and class labels explicit."
        description="The canonical export proved that division code and assigned class cannot be safely collapsed into one field. Teams stay per-registration because they may shift from year to year."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel rounded-[1.75rem] px-5 py-6">
          <p className="eyebrow mb-3">Create division</p>
          <DivisionForm />
        </div>
        <div className="panel rounded-[1.75rem] px-5 py-6">
          <p className="eyebrow mb-3">Create class group</p>
          <ClassGroupForm divisions={divisions} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[var(--forest)]">Division levels</h3>
            <p className="text-sm text-[var(--muted)]">{divisions.length} records</p>
          </div>
          {divisions.map((division) => (
            <details key={division.id} className="panel rounded-[1.75rem] px-5 py-6">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      {division.code} • {division.label}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {division.macroDivision.replaceAll("_", " ")} • {division.assignmentCount} assignments
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {division.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </summary>
              <div className="mt-5">
                <DivisionForm division={division} />
              </div>
            </details>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-[var(--forest)]">Class groups</h3>
            <p className="text-sm text-[var(--muted)]">{classGroups.length} records</p>
          </div>
          {classGroups.map((classGroup) => (
            <details key={classGroup.id} className="panel rounded-[1.75rem] px-5 py-6">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">{classGroup.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {classGroup.defaultDivisionCode
                        ? `${classGroup.defaultDivisionCode} • `
                        : ""}
                      {classGroup.assignmentCount} assignments
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {classGroup.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </summary>
              <div className="mt-5">
                <ClassGroupForm classGroup={classGroup} divisions={divisions} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

async function RegistrationCyclesSection({
  searchParams,
}: {
  searchParams: SectionSearchParams;
}) {
  const cycles = await listRegistrationCyclesForAdmin();

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Registration Cycles"
        title="Keep each chapter year as its own operational window."
        description="Registrations stay tied to a specific cycle so the app can support year-over-year roster history instead of flattening everything onto the current student row."
      />

      <div className="panel rounded-[1.75rem] px-5 py-6">
        <p className="eyebrow mb-3">Create cycle</p>
        <RegistrationCycleForm />
      </div>

      <div className="space-y-4">
        {cycles.length === 0 ? (
          <EmptyState
            title="No cycles yet"
            description="Create the active school-year registration cycle above so student registrations have a durable yearly home."
          />
        ) : (
          cycles.map((cycle) => (
            <details key={cycle.id} className="panel rounded-[1.75rem] px-5 py-6" open={cycle.isActive}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      {cycle.schoolYearLabel} • {cycle.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {cycle.registrationCount} registrations • {formatDateInput(cycle.startsOn)} to {formatDateInput(cycle.endsOn)}
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {cycle.isActive ? "Active cycle" : "Inactive cycle"}
                  </div>
                </div>
              </summary>
              <div className="mt-5">
                <RegistrationCycleForm cycle={cycle} />
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

async function ExportsSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const [cycles, divisions, classGroups] = await Promise.all([
    listRegistrationCyclesForAdmin(),
    listDivisionLevelsForAdmin(),
    listClassGroupsForAdmin(),
  ]);
  const rawFilters = parseCrmRosterFilters({
    attention: getSearchParamValue(searchParams.attention) ?? null,
    classGroupId: getSearchParamValue(searchParams.classGroupId) ?? null,
    cycleId: getSearchParamValue(searchParams.cycleId) ?? null,
    divisionId: getSearchParamValue(searchParams.divisionId) ?? null,
    registrationStatus: getSearchParamValue(searchParams.registrationStatus) ?? null,
    team: getSearchParamValue(searchParams.team) ?? null,
  });
  const filters = applyDefaultRosterCycle(rawFilters, cycles);
  const records = await listRosterRecordsForAdmin(filters);
  const exportQuery = buildRosterQueryString(filters);
  const needsAttentionCount = records.filter((record) => record.needsAttention).length;
  const missingPlacementCount = records.filter(
    (record) => !record.divisionId || !record.classGroupId,
  ).length;
  const cycleWasDefaulted = !rawFilters.cycleId && Boolean(filters.cycleId);

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Rosters / Exports"
        title="Answer placement and follow-up questions from one filtered roster."
        description="Leaders can scope the roster by cycle, division, class, team, and registration status, then export the same structured view back into a spreadsheet when downstream chapter workflows still need CSV."
      />

      <div className="panel rounded-[1.75rem] px-5 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Roster filters</p>
            <p className="max-w-3xl text-sm text-[var(--muted)]">
              Start from the active cycle by default, then narrow the roster until the table answers the exact class-placement or follow-up question in front of you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="button-primary"
              href={exportQuery ? `/admin/exports/download?${exportQuery}` : "/admin/exports/download"}
            >
              Download CSV
            </Link>
            <Link
              className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[rgba(164,61,47,0.38)] hover:text-[var(--accent)]"
              href="/admin/exports"
            >
              Clear filters
            </Link>
          </div>
        </div>

        <form action="/admin/exports" className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
          <Field label="Registration cycle / year">
            <Select defaultValue={filters.cycleId ?? ""} name="cycleId">
              <option value="">All cycles</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.schoolYearLabel} • {cycle.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Division">
            <Select defaultValue={filters.divisionId ?? ""} name="divisionId">
              <option value="">All divisions</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.code} • {division.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Class">
            <Select defaultValue={filters.classGroupId ?? ""} name="classGroupId">
              <option value="">All classes</option>
              {classGroups.map((classGroup) => (
                <option key={classGroup.id} value={classGroup.id}>
                  {classGroup.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Team" hint="Partial match against the per-registration team name.">
            <TextInput defaultValue={filters.team ?? ""} name="team" placeholder="Blue Team / Team 1" />
          </Field>

          <Field label="Registration status">
            <Select defaultValue={filters.registrationStatus ?? ""} name="registrationStatus">
              <option value="">All statuses</option>
              {CRM_REGISTRATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatCrmEnumLabel(status)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Attention state">
            <Select defaultValue={filters.attention} name="attention">
              {CRM_ROSTER_ATTENTION_FILTERS.map((attention) => (
                <option key={attention} value={attention}>
                  {attention === "all"
                    ? "All records"
                    : attention === "needs_attention"
                      ? "Needs follow-up"
                      : "Ready records"}
                </option>
              ))}
            </Select>
          </Field>

          <div className="xl:col-span-3 flex flex-wrap gap-3">
            <button className="button-primary" type="submit">
              Apply filters
            </button>
            {cycleWasDefaulted ? (
              <p className="rounded-full border border-[rgba(32,68,58,0.12)] bg-[rgba(32,68,58,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
                Defaulting to the active cycle: {getRosterCycleLabel(filters.cycleId, cycles)}.
              </p>
            ) : null}
          </div>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          detail={getRosterCycleLabel(filters.cycleId, cycles)}
          label="Records in view"
          value={String(records.length)}
        />
        <SummaryCard
          detail="Draft, missing-information, placement gaps, and certificate gaps are counted here."
          label="Need follow-up"
          value={String(needsAttentionCount)}
        />
        <SummaryCard
          detail="Records without a division or class assignment still need placement work."
          label="Missing placement"
          value={String(missingPlacementCount)}
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No roster records match this filter set"
          description="Broaden the cycle, division, class, status, or attention filters to see more registrations."
        />
      ) : (
        <div className="panel rounded-[1.75rem] px-5 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">Filtered roster</p>
              <h3 className="text-2xl font-semibold text-[var(--forest)]">Structured roster view</h3>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Export uses this exact filtered dataset, not manual copy-paste.
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  <th className="px-4 py-2 font-semibold">Student</th>
                  <th className="px-4 py-2 font-semibold">Cycle</th>
                  <th className="px-4 py-2 font-semibold">Placement</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className={
                      record.needsAttention
                        ? "bg-[rgba(164,61,47,0.06)]"
                        : "bg-white/74"
                    }
                  >
                    <td className="rounded-l-[1.25rem] border-y border-l border-[var(--line)] px-4 py-4 align-top">
                      <p className="font-semibold text-[var(--forest)]">{record.studentName}</p>
                      <p className="mt-1 text-[var(--muted)]">
                        {record.familyName ?? "No household linked"}
                      </p>
                      <div className="mt-3 text-xs text-[var(--muted)]">
                        <p>{record.primaryGuardianName ?? "No primary guardian recorded"}</p>
                        {record.primaryGuardianPhone ? <p>{record.primaryGuardianPhone}</p> : null}
                        {record.primaryGuardianEmail ? <p>{record.primaryGuardianEmail}</p> : null}
                      </div>
                    </td>
                    <td className="border-y border-[var(--line)] px-4 py-4 align-top">
                      <p className="font-semibold text-[var(--foreground)]">
                        {record.cycleSchoolYearLabel}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">{record.cycleName}</p>
                    </td>
                    <td className="border-y border-[var(--line)] px-4 py-4 align-top">
                      <p className="font-semibold text-[var(--foreground)]">
                        {record.divisionCode
                          ? `${record.divisionCode} • ${record.divisionLabel ?? "Division"}`
                          : "Division missing"}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        {record.classGroupName ?? "Class missing"}
                        {record.teamName ? ` • ${record.teamName}` : ""}
                      </p>
                    </td>
                    <td className="border-y border-[var(--line)] px-4 py-4 align-top">
                      <p className="font-semibold text-[var(--foreground)]">
                        {formatCrmEnumLabel(record.registrationStatus)}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Certificate: {formatCrmEnumLabel(record.certificateStatus)}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Parent notified: {record.parentNotifiedStatus ?? "Not set"}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        Paid: {formatMoney(record.totalPaid)}
                      </p>
                    </td>
                    <td className="rounded-r-[1.25rem] border-y border-r border-[var(--line)] px-4 py-4 align-top">
                      <RosterAttentionBadge record={record} />
                      {record.needsAttention ? (
                        <ul className="mt-3 space-y-2 text-xs text-[var(--muted)]">
                          {record.attentionReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-xs text-[var(--muted)]">
                          Placement and registration status are clear enough for standard roster use.
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
