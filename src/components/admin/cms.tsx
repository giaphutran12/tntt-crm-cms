import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import {
  getCmsDashboardSummary,
  getFallbackManagedPage,
  getFallbackContactNotes,
  listAnnouncementsForAdmin,
  listMediaAssetsForAdmin,
  listPagesForAdmin,
  listResourcesForAdmin,
  listScheduleItemsForAdmin,
  MANAGED_PAGE_SLUGS,
  type CmsAnnouncement,
  type CmsMediaAsset,
  type CmsPageEditorRecord,
  type CmsResource,
  type CmsScheduleItem,
} from "@/lib/cms";
import { getOptionalServerEnv, isDatabaseConfigured } from "@/lib/env";
import {
  deleteAnnouncementAction,
  deleteMediaAssetAction,
  deleteResourceAction,
  deleteScheduleItemAction,
  saveAnnouncementAction,
  saveManagedPageAction,
  saveMediaAssetAction,
  saveResourceAction,
  saveScheduleItemAction,
  updateMediaAssetAction,
} from "@/app/admin/actions";

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

function DatabaseRequiredPanel() {
  return (
    <section className="panel rounded-[2rem] px-6 py-8 md:px-8">
      <p className="eyebrow mb-3">CMS unavailable</p>
      <h2 className="display-title text-3xl font-semibold text-[var(--forest)]">
        The content workflow needs a live Postgres connection.
      </h2>
      <p className="muted mt-4 max-w-3xl text-base md:text-lg">
        The admin screens are rendered, but `DATABASE_URL` is missing in this environment,
        so content records cannot be saved yet. Add the database connection, run the checked-in
        migrations, then come back to publish announcements, schedule items, resources, and pages.
      </p>
    </section>
  );
}

function Field({
  children,
  label,
  hint,
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
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="inline-flex items-center gap-3 rounded-[1rem] border border-[var(--line)] bg-white/78 px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
      <input defaultChecked={defaultChecked} name={name} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not published yet";
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

export async function CmsDashboardPanel() {
  if (!isDatabaseConfigured()) {
    return <DatabaseRequiredPanel />;
  }

  const snapshot = await getCmsDashboardSummary();
  const publishedAnnouncements = snapshot.announcements.filter(
    (record) => record.status === "published",
  ).length;
  const publishedResources = snapshot.resources.filter(
    (record) => record.status === "published",
  ).length;
  const publishedScheduleItems = snapshot.scheduleItems.filter(
    (record) => record.status === "published",
  ).length;
  const publishedPages = snapshot.pages.filter((record) => record.status === "published").length;

  return (
    <section className="space-y-6">
      <div className="panel rounded-[2rem] px-6 py-8 md:px-8">
        <p className="eyebrow mb-3">Publishing workspace</p>
        <h2 className="display-title text-4xl font-semibold text-[var(--forest)]">
          Content workflows are live inside the admin shell.
        </h2>
        <p className="muted mt-4 max-w-3xl text-lg">
          Editors can create announcements, upload a retreat PDF, publish it, and
          immediately feed the public site without touching code.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Published announcements" value={publishedAnnouncements} />
        <SummaryCard label="Published schedule items" value={publishedScheduleItems} />
        <SummaryCard label="Published resources" value={publishedResources} />
        <SummaryCard label="Published static pages" value={publishedPages} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[1.75rem] px-5 py-6">
          <p className="eyebrow mb-2">Core workflow</p>
          <h3 className="text-2xl font-semibold text-[var(--forest)]">
            Sign in, draft, attach, publish.
          </h3>
          <div className="mt-4 grid gap-3">
            {[
              "Open Announcements and draft the retreat post with a clear parent-facing title and summary.",
              "Attach the public PDF directly in the same form or upload assets separately in Media.",
              "Set status to Published and the homepage + public archive will pick it up after save.",
            ].map((step) => (
              <div
                key={step}
                className="rounded-[1.25rem] border border-[var(--line)] bg-white/78 px-4 py-4 text-sm text-[var(--muted)]"
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-[1.75rem] px-5 py-6">
          <p className="eyebrow mb-2">Current inventory</p>
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <p>
              Total announcements: <span className="font-semibold text-[var(--foreground)]">{snapshot.announcements.length}</span>
            </p>
            <p>
              Managed pages: <span className="font-semibold text-[var(--foreground)]">{snapshot.pages.length}</span>
            </p>
            <p>
              Schedule entries: <span className="font-semibold text-[var(--foreground)]">{snapshot.scheduleItems.length}</span>
            </p>
            <p>
              Resource records: <span className="font-semibold text-[var(--foreground)]">{snapshot.resources.length}</span>
            </p>
            <p>
              Media assets: <span className="font-semibold text-[var(--foreground)]">{snapshot.mediaAssets.length}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel rounded-[1.75rem] px-5 py-6">
      <p className="eyebrow mb-2">{label}</p>
      <p className="display-title text-4xl font-semibold text-[var(--forest)]">{value}</p>
    </div>
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

function ActionButtons({
  deleteAction,
  id,
}: {
  deleteAction?: (formData: FormData) => void;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button className="button-primary" type="submit">
        Save
      </button>
      {deleteAction && id ? (
        <button className="button-secondary" formAction={deleteAction} type="submit">
          Delete
        </button>
      ) : null}
    </div>
  );
}

function AnnouncementForm({
  announcement,
}: {
  announcement?: CmsAnnouncement;
}) {
  return (
    <form action={saveAnnouncementAction} className="grid gap-4">
      <input name="id" type="hidden" defaultValue={announcement?.id ?? ""} />
      <input
        name="existingAttachmentId"
        type="hidden"
        defaultValue={announcement?.attachment?.id ?? ""}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Title (English)">
          <TextInput defaultValue={announcement?.titleEn ?? ""} name="titleEn" required />
        </Field>
        <Field label="Title (Vietnamese, optional)">
          <TextInput defaultValue={announcement?.titleVi ?? ""} name="titleVi" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Field label="Slug">
          <TextInput defaultValue={announcement?.slug ?? ""} name="slug" placeholder="retreat-registration-window" />
        </Field>
        <Field label="Audience">
          <TextInput defaultValue={announcement?.audience ?? ""} name="audience" placeholder="Parents and families" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Summary (English)">
          <Textarea defaultValue={announcement?.summaryEn ?? ""} name="summaryEn" />
        </Field>
        <Field label="Summary (Vietnamese, optional)">
          <Textarea defaultValue={announcement?.summaryVi ?? ""} name="summaryVi" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Body (English)">
          <Textarea defaultValue={announcement?.bodyEn ?? ""} name="bodyEn" />
        </Field>
        <Field label="Body (Vietnamese, optional)">
          <Textarea defaultValue={announcement?.bodyVi ?? ""} name="bodyVi" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.55fr_0.45fr]">
        <div className="grid gap-4">
          <Field label="Status">
            <Select defaultValue={announcement?.status ?? "draft"} name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
          <Toggle defaultChecked={announcement?.isFeatured} label="Feature on homepage" name="isFeatured" />
        </div>

        <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/76 px-4 py-4 text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">
            Current attachment: {announcement?.attachment?.label ?? "None"}
          </p>
          <p className="mt-2">
            Published: {formatTimestamp(announcement?.publishedAt ?? null)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-[var(--line)] bg-white/74 px-5 py-5">
        <div>
          <p className="font-semibold text-[var(--foreground)]">Optional public attachment</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Upload a retreat PDF or other public document directly here. New uploads will replace the current linked file for this announcement.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Field label="Attachment label">
            <TextInput defaultValue={announcement?.attachment?.label ?? ""} name="attachmentLabel" />
          </Field>
          <Field label="Attachment file">
            <TextInput accept=".pdf,image/*" name="attachmentFile" type="file" />
          </Field>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Attachment alt text (for image uploads)">
            <TextInput defaultValue={announcement?.attachment?.altText ?? ""} name="attachmentAltText" />
          </Field>
          <Field label="Attachment caption">
            <TextInput defaultValue={announcement?.attachment?.caption ?? ""} name="attachmentCaption" />
          </Field>
        </div>
      </div>

      <ActionButtons deleteAction={deleteAnnouncementAction} id={announcement?.id} />
    </form>
  );
}

function ManagedPageForm({ page }: { page: CmsPageEditorRecord }) {
  return (
    <form action={saveManagedPageAction} className="grid gap-4">
      <input name="slug" type="hidden" value={page.slug} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-[var(--forest)]">
            {page.slug === "home" ? "Homepage" : page.slug === "about" ? "About page" : "Contact page"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">Public route: {page.route}</p>
        </div>
        <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          {page.exists ? "Existing record" : "Create first record"}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Title (English)">
          <TextInput defaultValue={page.titleEn} name="titleEn" required />
        </Field>
        <Field label="Title (Vietnamese, optional)">
          <TextInput defaultValue={page.titleVi ?? ""} name="titleVi" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Summary (English)">
          <Textarea defaultValue={page.summaryEn} name="summaryEn" />
        </Field>
        <Field label="Summary (Vietnamese, optional)">
          <Textarea defaultValue={page.summaryVi ?? ""} name="summaryVi" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Body (English)">
          <Textarea defaultValue={page.bodyEn} name="bodyEn" />
        </Field>
        <Field label="Body (Vietnamese, optional)">
          <Textarea defaultValue={page.bodyVi ?? ""} name="bodyVi" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
        <Field label="Status">
          <Select defaultValue={page.status} name="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </Field>
        <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/76 px-4 py-4 text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">Published</p>
          <p className="mt-1">{formatTimestamp(page.publishedAt)}</p>
        </div>
      </div>

      <div>
        <button className="button-primary" type="submit">
          Save page
        </button>
      </div>
    </form>
  );
}

function ScheduleItemForm({ item }: { item?: CmsScheduleItem }) {
  return (
    <form action={saveScheduleItemAction} className="grid gap-4">
      <input name="id" type="hidden" defaultValue={item?.id ?? ""} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Title (English)">
          <TextInput defaultValue={item?.titleEn ?? ""} name="titleEn" required />
        </Field>
        <Field label="Title (Vietnamese, optional)">
          <TextInput defaultValue={item?.titleVi ?? ""} name="titleVi" />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Date label (English)">
          <TextInput defaultValue={item?.dateLabelEn ?? ""} name="dateLabelEn" placeholder="Sunday rhythm" />
        </Field>
        <Field label="Date label (Vietnamese, optional)">
          <TextInput defaultValue={item?.dateLabelVi ?? ""} name="dateLabelVi" />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Note (English)">
          <Textarea defaultValue={item?.noteEn ?? ""} name="noteEn" />
        </Field>
        <Field label="Note (Vietnamese, optional)">
          <Textarea defaultValue={item?.noteVi ?? ""} name="noteVi" />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr]">
        <Field label="Audience">
          <TextInput defaultValue={item?.audience ?? ""} name="audience" />
        </Field>
        <Field label="Sort order">
          <TextInput defaultValue={item?.sortOrder ?? 0} name="sortOrder" type="number" />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Action label">
          <TextInput defaultValue={item?.actionLabel ?? ""} name="actionLabel" placeholder="Open retreat packet" />
        </Field>
        <Field label="Action URL">
          <TextInput defaultValue={item?.actionHref ?? ""} name="actionHref" placeholder="https://..." />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="grid gap-4">
          <Field label="Status">
            <Select defaultValue={item?.status ?? "draft"} name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
          <Toggle defaultChecked={item?.isFeatured} label="Feature on homepage date list" name="isFeatured" />
        </div>
        <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/76 px-4 py-4 text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">Published</p>
          <p className="mt-1">{formatTimestamp(item?.publishedAt ?? null)}</p>
        </div>
      </div>
      <ActionButtons deleteAction={deleteScheduleItemAction} id={item?.id} />
    </form>
  );
}

function ResourceForm({ resource }: { resource?: CmsResource }) {
  return (
    <form action={saveResourceAction} className="grid gap-4">
      <input name="id" type="hidden" defaultValue={resource?.id ?? ""} />
      <input name="existingFileMediaId" type="hidden" defaultValue={resource?.file?.id ?? ""} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Title (English)">
          <TextInput defaultValue={resource?.titleEn ?? ""} name="titleEn" required />
        </Field>
        <Field label="Title (Vietnamese, optional)">
          <TextInput defaultValue={resource?.titleVi ?? ""} name="titleVi" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Description (English)">
          <Textarea defaultValue={resource?.descriptionEn ?? ""} name="descriptionEn" />
        </Field>
        <Field label="Description (Vietnamese, optional)">
          <Textarea defaultValue={resource?.descriptionVi ?? ""} name="descriptionVi" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr]">
        <Field label="Audience">
          <TextInput defaultValue={resource?.audience ?? ""} name="audience" placeholder="Families registering students" />
        </Field>
        <Field label="Sort order">
          <TextInput defaultValue={resource?.sortOrder ?? 0} name="sortOrder" type="number" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Availability label">
          <TextInput defaultValue={resource?.availabilityLabel ?? ""} name="availabilityLabel" placeholder="Open now" />
        </Field>
        <Field label="External link URL (optional)">
          <TextInput defaultValue={resource?.linkUrl ?? ""} name="linkUrl" placeholder="https://..." />
        </Field>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-[var(--line)] bg-white/74 px-5 py-5">
        <div>
          <p className="font-semibold text-[var(--foreground)]">
            Current file: {resource?.file?.label ?? "No uploaded file"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Use either an uploaded public file, an external link, or both.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Field label="File label">
            <TextInput defaultValue={resource?.file?.label ?? ""} name="fileLabel" />
          </Field>
          <Field label="Upload file">
            <TextInput accept=".pdf,image/*" name="resourceFile" type="file" />
          </Field>
        </div>
        <Field label="File caption">
          <TextInput defaultValue={resource?.file?.caption ?? ""} name="fileCaption" />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
        <div className="grid gap-4">
          <Field label="Status">
            <Select defaultValue={resource?.status ?? "draft"} name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
          <Toggle defaultChecked={resource?.isFeatured} label="Feature on homepage resources" name="isFeatured" />
        </div>
        <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/76 px-4 py-4 text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">Published</p>
          <p className="mt-1">{formatTimestamp(resource?.publishedAt ?? null)}</p>
        </div>
      </div>

      <ActionButtons deleteAction={deleteResourceAction} id={resource?.id} />
    </form>
  );
}

function MediaAssetForm({ asset }: { asset?: CmsMediaAsset }) {
  if (asset) {
    return (
      <form action={updateMediaAssetAction} className="grid gap-4">
        <input name="id" type="hidden" value={asset.id} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Label">
            <TextInput defaultValue={asset.label} name="label" required />
          </Field>
          <Field label="Alt text">
            <TextInput defaultValue={asset.altText ?? ""} name="altText" />
          </Field>
        </div>
        <Field label="Caption">
          <Textarea defaultValue={asset.caption ?? ""} name="caption" />
        </Field>
        <div className="rounded-[1.25rem] border border-[var(--line)] bg-white/76 px-4 py-4 text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">Public URL</p>
          <Link className="mt-1 block break-all text-[var(--accent)]" href={asset.publicUrl} target="_blank">
            {asset.publicUrl}
          </Link>
          <p className="mt-2">Kind: {asset.kind}</p>
        </div>
        <ActionButtons deleteAction={deleteMediaAssetAction} id={asset.id} />
      </form>
    );
  }

  return (
    <form action={saveMediaAssetAction} className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Label">
          <TextInput name="label" placeholder="Retreat packet PDF" required />
        </Field>
        <Field label="Folder">
          <TextInput defaultValue="media" name="folder" placeholder="media" />
        </Field>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="File">
          <TextInput name="file" required type="file" />
        </Field>
        <Field label="Alt text">
          <TextInput name="altText" />
        </Field>
      </div>
      <Field label="Caption">
        <Textarea name="caption" />
      </Field>
      <div>
        <button className="button-primary" type="submit">
          Upload asset
        </button>
      </div>
    </form>
  );
}

export async function CmsSectionContent({
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
    case "announcements":
      return <AnnouncementsSection searchParams={searchParams} />;
    case "pages":
      return <PagesSection searchParams={searchParams} />;
    case "schedule":
      return <ScheduleSection searchParams={searchParams} />;
    case "resources":
      return <ResourcesSection searchParams={searchParams} />;
    case "media":
      return <MediaSection searchParams={searchParams} />;
    default:
      return null;
  }
}

async function AnnouncementsSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const announcements = await listAnnouncementsForAdmin();

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Announcements"
        title="Draft and publish chapter-wide updates."
        description="This is the core workflow for retreat notices, family reminders, and other public announcements. Attach a PDF directly in the same form when needed."
      />

      <div className="panel rounded-[1.75rem] px-5 py-6">
        <p className="eyebrow mb-3">Create announcement</p>
        <AnnouncementForm />
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <EmptyState
            title="No announcements yet"
            description="Create the first announcement above. Once it is published, it will appear on the public homepage and announcement archive."
          />
        ) : (
          announcements.map((announcement) => (
            <details
              key={announcement.id}
              className="panel rounded-[1.75rem] px-5 py-6"
              open={announcement.isFeatured}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">
                      {announcement.titleEn}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {announcement.slug} • {announcement.status} • {formatTimestamp(announcement.publishedAt)}
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {announcement.isFeatured ? "Featured" : "Standard"}
                  </div>
                </div>
              </summary>
              <div className="mt-5">
                <AnnouncementForm announcement={announcement} />
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

async function PagesSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const pages = await listPagesForAdmin();

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Static pages"
        title="Manage the text for the fixed public routes."
        description="Home, About, and Contact remain dedicated routes in the app, but the core copy now lives in the CMS so editors can update those pages without code changes."
      />

      <div className="space-y-4">
        {MANAGED_PAGE_SLUGS.map((slug) => {
          const page = pages.find((record) => record.slug === slug) ?? getFallbackManagedPage(slug);

          return (
            <div key={slug} className="panel rounded-[1.75rem] px-5 py-6">
              <ManagedPageForm page={page} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function ScheduleSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const scheduleItems = await listScheduleItemsForAdmin();

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Schedule"
        title="Keep the public date list simple and current."
        description="Use featured entries for the homepage and keep the main schedule page focused on the weekly rhythm plus special dates parents need to see."
      />

      <div className="panel rounded-[1.75rem] px-5 py-6">
        <p className="eyebrow mb-3">Create schedule item</p>
        <ScheduleItemForm />
      </div>

      <div className="space-y-4">
        {scheduleItems.length === 0 ? (
          <EmptyState
            title="No schedule items yet"
            description="Create the first public date or weekly rhythm entry above. Published entries will feed both the schedule page and the homepage date preview."
          />
        ) : (
          scheduleItems.map((item) => (
            <details
              key={item.id}
              className="panel rounded-[1.75rem] px-5 py-6"
              open={item.isFeatured}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">{item.titleEn}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.dateLabelEn} • {item.status} • order {item.sortOrder}
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {item.isFeatured ? "Featured" : "Standard"}
                  </div>
                </div>
              </summary>
              <div className="mt-5">
                <ScheduleItemForm item={item} />
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

async function ResourcesSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const resources = await listResourcesForAdmin();

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Forms / Resources"
        title="Publish packets, handbooks, and evergreen downloads."
        description="Resources can point to an uploaded public file, an external link, or both. Feature the most important records on the homepage."
      />

      <div className="panel rounded-[1.75rem] px-5 py-6">
        <p className="eyebrow mb-3">Create resource</p>
        <ResourceForm />
      </div>

      <div className="space-y-4">
        {resources.length === 0 ? (
          <EmptyState
            title="No resources yet"
            description="Create the first public resource above. Published records will populate the forms and resources page automatically."
          />
        ) : (
          resources.map((resource) => (
            <details
              key={resource.id}
              className="panel rounded-[1.75rem] px-5 py-6"
              open={resource.isFeatured}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">{resource.titleEn}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {resource.status} • order {resource.sortOrder} • {resource.file?.label ?? resource.linkUrl ?? "No download linked yet"}
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {resource.isFeatured ? "Featured" : "Standard"}
                  </div>
                </div>
              </summary>
              <div className="mt-5">
                <ResourceForm resource={resource} />
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

async function MediaSection({ searchParams }: { searchParams: SectionSearchParams }) {
  const mediaAssets = await listMediaAssetsForAdmin();
  const { SUPABASE_PUBLIC_MEDIA_BUCKET } = getOptionalServerEnv();

  return (
    <section className="space-y-6">
      <NoticeBanner {...searchParams} />
      <SectionIntro
        eyebrow="Media library"
        title="Upload and manage public files."
        description={`Assets in this library live in the public bucket (${SUPABASE_PUBLIC_MEDIA_BUCKET}) and can be attached to announcements or resource records.`}
      />

      <div className="panel rounded-[1.75rem] px-5 py-6">
        <p className="eyebrow mb-3">Upload asset</p>
        <MediaAssetForm />
      </div>

      <div className="space-y-4">
        {mediaAssets.length === 0 ? (
          <EmptyState
            title="No media assets yet"
            description="Upload a PDF, form packet, or public image above. Assets uploaded here can later be linked from announcements and resource records."
          />
        ) : (
          mediaAssets.map((asset) => (
            <details key={asset.id} className="panel rounded-[1.75rem] px-5 py-6">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--forest)]">{asset.label}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {asset.kind} • {asset.mimeType ?? "unknown type"} • {asset.sizeBytes ?? 0} bytes
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-white/78 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Updated {formatTimestamp(asset.updatedAt)}
                  </div>
                </div>
              </summary>
              <div className="mt-5">
                <MediaAssetForm asset={asset} />
              </div>
            </details>
          ))
        )}
      </div>
    </section>
  );
}

export function ContactCmsFallbackNotes() {
  return getFallbackContactNotes();
}
