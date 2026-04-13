import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import {
  APP_ROLES,
  getRoleDescription,
  getRoleLabel,
  type AppRole,
} from "@/lib/auth/roles";
import type { AppUser } from "@/lib/auth/session";
import {
  listStaffAccessRecords,
  listStaffRoleChangeRecords,
  type StaffAccessRecord,
  type StaffRoleChangeRecord,
} from "@/lib/auth/staff-user-provisioning";
import { getStaffSignupAvailability } from "@/lib/auth/staff-user-provisioning";
import { updateStaffRoleAction } from "@/app/admin/settings-actions";

type SearchParamValue = string | string[] | undefined;

type SectionSearchParams = Record<string, SearchParamValue> & {
  error?: SearchParamValue;
  notice?: SearchParamValue;
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

function SectionIntro({
  description,
  eyebrow,
  title,
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

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-[1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(164,61,47,0.38)] focus:ring-2 focus:ring-[rgba(164,61,47,0.12)] ${props.className ?? ""}`}
    />
  );
}

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[6rem] w-full rounded-[1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(164,61,47,0.38)] focus:ring-2 focus:ring-[rgba(164,61,47,0.12)] ${props.className ?? ""}`}
    />
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

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function RoleBadge({ role }: { role: AppRole }) {
  const tone =
    role === "admin"
      ? "border-[rgba(97,73,27,0.2)] bg-[rgba(97,73,27,0.08)] text-[var(--forest)]"
      : role === "operations"
        ? "border-[rgba(32,68,58,0.18)] bg-[rgba(32,68,58,0.08)] text-[var(--forest)]"
        : "border-[rgba(164,61,47,0.16)] bg-[rgba(164,61,47,0.08)] text-[var(--accent-strong)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}>
      {getRoleLabel(role)}
    </span>
  );
}

function RoleSummaryCard({ role }: { role: AppRole }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-5 py-5">
      <p className="eyebrow mb-2">{getRoleLabel(role)}</p>
      <p className="text-sm text-[var(--muted)]">{getRoleDescription(role)}</p>
    </div>
  );
}

function StaffAccessRow({
  currentUser,
  record,
}: {
  currentUser: AppUser;
  record: StaffAccessRecord;
}) {
  const isCurrentUser = currentUser.id === record.id;

  return (
    <details className="panel rounded-[1.75rem] px-5 py-6">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[var(--forest)]">
              {record.displayName ?? record.email ?? "Unnamed staff account"}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {record.email ?? "No email recorded"} • updated {formatTimestamp(record.updatedAt)}
            </p>
          </div>
          <RoleBadge role={record.role} />
        </div>
      </summary>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.72fr_0.28fr]">
        {isCurrentUser ? (
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-5 py-5 text-sm text-[var(--muted)]">
            <p className="font-semibold text-[var(--foreground)]">Current account</p>
            <p className="mt-2">
              Use a different admin account to change your own role. That avoids accidental self-demotion and lockout.
            </p>
          </div>
        ) : (
          <form action={updateStaffRoleAction} className="grid gap-4">
            <input name="subjectUserId" type="hidden" value={record.id} />
            <div className="grid gap-4 lg:grid-cols-[0.4fr_0.6fr]">
              <Field label="Role">
                <Select defaultValue={record.role} name="nextRole">
                  {APP_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                hint="Why is this person being promoted or demoted? Future-you will want the breadcrumb."
                label="Audit note (optional)"
              >
                <Textarea
                  name="note"
                  placeholder="Example: promoted to operations for roster intake and exports."
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="button-primary" type="submit">
                Save role
              </button>
              <p className="text-sm text-[var(--muted)]">
                This updates both the app role record and the auth metadata copy.
              </p>
            </div>
          </form>
        )}

        <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/76 p-5 text-sm text-[var(--muted)]">
          <p className="eyebrow mb-2">Current access</p>
          <p>
            Created:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {formatTimestamp(record.createdAt)}
            </span>
          </p>
          <p className="mt-2">
            Tier:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {getRoleLabel(record.role)}
            </span>
          </p>
          <p className="mt-2">{getRoleDescription(record.role)}</p>
        </div>
      </div>
    </details>
  );
}

function AuditEntry({ entry }: { entry: StaffRoleChangeRecord }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/78 px-5 py-5 text-sm text-[var(--muted)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-[var(--foreground)]">
          {entry.subjectDisplayName ?? entry.subjectEmail ?? "Unknown staff"}:{" "}
          {getRoleLabel(entry.oldRole)} to {getRoleLabel(entry.newRole)}
        </p>
        <p>{formatTimestamp(entry.createdAt)}</p>
      </div>
      <p className="mt-2">
        Changed by{" "}
        <span className="font-semibold text-[var(--foreground)]">
          {entry.actorDisplayName ?? entry.actorEmail ?? "Unknown admin"}
        </span>
      </p>
      {entry.note ? <p className="mt-2">{entry.note}</p> : null}
    </div>
  );
}

function ServiceRoleRequiredPanel() {
  const availability = getStaffSignupAvailability();

  return (
    <section className="panel rounded-[2rem] px-6 py-8 md:px-8">
      <p className="eyebrow mb-3">Settings unavailable</p>
      <h2 className="display-title text-3xl font-semibold text-[var(--forest)]">
        Staff role management needs the hosted Supabase admin credentials.
      </h2>
      <p className="muted mt-4 max-w-3xl text-base md:text-lg">
        Current status: {availability.status === "available" ? "available" : availability.reason}.
        The admin settings screen can only list staff and sync role changes when the
        service-role path is configured.
      </p>
    </section>
  );
}

export async function AdminSettingsSection({
  currentUser,
  searchParams,
}: {
  currentUser: AppUser;
  searchParams: SectionSearchParams;
}) {
  if (getStaffSignupAvailability().status === "unavailable") {
    return (
      <section className="space-y-6">
        <NoticeBanner {...searchParams} />
        <ServiceRoleRequiredPanel />
      </section>
    );
  }

  const [staffRecords, auditEntries] = await Promise.all([
    listStaffAccessRecords(),
    listStaffRoleChangeRecords(),
  ]);

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Administration"
        title="Manage who can publish, touch CRM data, or change staff permissions."
        description="This is the one place where role changes happen. Editors stay in public-content lanes, operations handles chapter records, and admins control staff access itself."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <RoleSummaryCard role="editor" />
        <RoleSummaryCard role="operations" />
        <RoleSummaryCard role="admin" />
      </div>

      <div className="panel rounded-[1.75rem] px-5 py-6">
        <p className="eyebrow mb-2">Default behavior</p>
        <p className="text-sm text-[var(--muted)]">
          New gated sign-ups default to <span className="font-semibold text-[var(--foreground)]">Editor</span>.
          Promotions to Operations or Admin must happen here, by an existing admin.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-[var(--forest)]">Staff access</h3>
          <p className="text-sm text-[var(--muted)]">{staffRecords.length} staff accounts</p>
        </div>

        {staffRecords.length === 0 ? (
          <EmptyState
            title="No staff accounts yet"
            description="Create the first staff sign-up, then promote or demote accounts here."
          />
        ) : (
          staffRecords.map((record) => (
            <StaffAccessRow
              key={record.id}
              currentUser={currentUser}
              record={record}
            />
          ))
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-[var(--forest)]">Recent role changes</h3>
          <p className="text-sm text-[var(--muted)]">Last {auditEntries.length} changes</p>
        </div>

        {auditEntries.length === 0 ? (
          <EmptyState
            title="No role changes yet"
            description="Role changes will appear here once an admin promotes or demotes a staff account."
          />
        ) : (
          auditEntries.map((entry) => <AuditEntry entry={entry} key={entry.id} />)
        )}
      </div>
    </section>
  );
}
