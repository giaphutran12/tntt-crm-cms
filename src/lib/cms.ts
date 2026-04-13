import "server-only";

import { isDatabaseConfigured } from "@/lib/env";
import {
  announcementPreviews,
  contactCards,
  resourcePreviews,
  upcomingDates,
  weeklyRhythm,
} from "@/lib/public-site";
import { query } from "@/server/db";

export const CMS_STATUSES = ["draft", "published"] as const;
export type CmsStatus = (typeof CMS_STATUSES)[number];

export const MANAGED_PAGE_SLUGS = ["home", "about", "contact"] as const;
export type ManagedPageSlug = (typeof MANAGED_PAGE_SLUGS)[number];

export type CmsMediaKind = "image" | "file";

export type CmsMediaAsset = {
  altText: string | null;
  bucket: string;
  caption: string | null;
  createdAt: string;
  id: string;
  kind: CmsMediaKind;
  label: string;
  mimeType: string | null;
  publicUrl: string;
  sizeBytes: number | null;
  storagePath: string;
  updatedAt: string;
};

export type CmsAnnouncement = {
  attachment: CmsMediaAsset | null;
  audience: string | null;
  bodyEn: string;
  bodyVi: string | null;
  createdAt: string;
  id: string;
  isFeatured: boolean;
  publishedAt: string | null;
  slug: string;
  status: CmsStatus;
  summaryEn: string;
  summaryVi: string | null;
  titleEn: string;
  titleVi: string | null;
  updatedAt: string;
};

export type CmsPage = {
  bodyEn: string;
  bodyVi: string | null;
  createdAt: string;
  id: string;
  publishedAt: string | null;
  slug: ManagedPageSlug;
  status: CmsStatus;
  summaryEn: string;
  summaryVi: string | null;
  titleEn: string;
  titleVi: string | null;
  updatedAt: string;
};

export type CmsPageEditorRecord = CmsPage & {
  exists: boolean;
  route: string;
};

export type CmsScheduleItem = {
  actionHref: string | null;
  actionLabel: string | null;
  audience: string | null;
  createdAt: string;
  dateLabelEn: string;
  dateLabelVi: string | null;
  id: string;
  isFeatured: boolean;
  noteEn: string;
  noteVi: string | null;
  publishedAt: string | null;
  sortOrder: number;
  status: CmsStatus;
  titleEn: string;
  titleVi: string | null;
  updatedAt: string;
};

export type CmsResource = {
  audience: string | null;
  availabilityLabel: string | null;
  createdAt: string;
  descriptionEn: string;
  descriptionVi: string | null;
  file: CmsMediaAsset | null;
  id: string;
  isFeatured: boolean;
  linkUrl: string | null;
  publishedAt: string | null;
  sortOrder: number;
  status: CmsStatus;
  titleEn: string;
  titleVi: string | null;
  updatedAt: string;
};

type CmsMediaAssetRow = {
  alt_text: string | null;
  bucket: string;
  caption: string | null;
  created_at: string;
  id: string;
  kind: CmsMediaKind;
  label: string;
  mime_type: string | null;
  public_url: string;
  size_bytes: number | null;
  storage_path: string;
  updated_at: string;
};

type CmsAnnouncementRow = {
  attachment_alt_text: string | null;
  attachment_bucket: string | null;
  attachment_caption: string | null;
  attachment_created_at: string | null;
  attachment_id: string | null;
  attachment_kind: CmsMediaKind | null;
  attachment_label: string | null;
  attachment_mime_type: string | null;
  attachment_public_url: string | null;
  attachment_size_bytes: number | null;
  attachment_storage_path: string | null;
  attachment_updated_at: string | null;
  audience: string | null;
  body_en: string;
  body_vi: string | null;
  created_at: string;
  id: string;
  is_featured: boolean;
  published_at: string | null;
  slug: string;
  status: CmsStatus;
  summary_en: string;
  summary_vi: string | null;
  title_en: string;
  title_vi: string | null;
  updated_at: string;
};

type CmsPageRow = {
  body_en: string;
  body_vi: string | null;
  created_at: string;
  id: string;
  published_at: string | null;
  slug: ManagedPageSlug;
  status: CmsStatus;
  summary_en: string;
  summary_vi: string | null;
  title_en: string;
  title_vi: string | null;
  updated_at: string;
};

type CmsScheduleItemRow = {
  action_href: string | null;
  action_label: string | null;
  audience: string | null;
  created_at: string;
  date_label_en: string;
  date_label_vi: string | null;
  id: string;
  is_featured: boolean;
  note_en: string;
  note_vi: string | null;
  published_at: string | null;
  sort_order: number;
  status: CmsStatus;
  title_en: string;
  title_vi: string | null;
  updated_at: string;
};

type CmsResourceRow = {
  audience: string | null;
  availability_label: string | null;
  created_at: string;
  description_en: string;
  description_vi: string | null;
  file_alt_text: string | null;
  file_bucket: string | null;
  file_caption: string | null;
  file_created_at: string | null;
  file_id: string | null;
  file_kind: CmsMediaKind | null;
  file_label: string | null;
  file_link_url: string | null;
  file_mime_type: string | null;
  file_public_url: string | null;
  file_size_bytes: number | null;
  file_storage_path: string | null;
  file_updated_at: string | null;
  id: string;
  is_featured: boolean;
  link_url: string | null;
  published_at: string | null;
  sort_order: number;
  status: CmsStatus;
  title_en: string;
  title_vi: string | null;
  updated_at: string;
};

type FallbackManagedPage = {
  bodyEn: string;
  route: string;
  slug: ManagedPageSlug;
  summaryEn: string;
  titleEn: string;
};

const FALLBACK_MANAGED_PAGES: Record<ManagedPageSlug, FallbackManagedPage> = {
  home: {
    slug: "home",
    route: "/",
    titleEn: "A family-first chapter website for announcements, schedules, and forms.",
    summaryEn:
      "This representative homepage shows how TNTT Surrey families can check the latest announcements, review upcoming dates, and reopen key documents without chasing old emails.",
    bodyEn: [
      "This local-development fallback mirrors the intended production experience: a small set of clear public routes backed by CMS-managed copy, announcements, schedules, and downloadable files.",
      "Families should be able to answer the common questions quickly: what changed, what is coming up, and which form or checklist they need to reopen today.",
      "Student rosters, guardian contacts, paper-registration artifacts, and health details stay out of the public shell entirely.",
    ].join("\n\n"),
  },
  about: {
    slug: "about",
    route: "/about",
    titleEn: "A chapter overview shaped for families who may be new to TNTT.",
    summaryEn:
      "Explain the chapter, parish context, and division-based structure in clear family-facing language without turning the public site into a private directory.",
    bodyEn: [
      "TNTT Surrey serves the Our Lady of La Vang Vietnamese community at St. Matthew's Parish and gives families a stable public place to understand the chapter rhythm before or after registration.",
      "The public story belongs here: what TNTT is, how the local chapter fits parish life, and how the divisions help families understand age-appropriate formation.",
      "Public storytelling belongs here. Student rosters, guardian contacts, and yearly registration follow-up do not.",
    ].join("\n\n"),
  },
  contact: {
    slug: "contact",
    route: "/contact",
    titleEn: "A public contact page that keeps family guidance clear and private data separate.",
    summaryEn:
      "The contact route should give families one stable next step for public questions while keeping staff-only CRM data behind authenticated access.",
    bodyEn: [
      "A chapter-managed public inbox and a few clear routing notes reduce the need for families to guess which leader to message for schedule or paperwork questions.",
      "Until leadership finalizes every public detail, the site should stay honest: publish what is confirmed, avoid invented contact data, and keep staff-only records in the admin workspace.",
      "This route remains clearly public and separate from internal staff, family, and student records.",
    ].join("\n\n"),
  },
};

const DEMO_MEDIA_ASSET_DATES = {
  createdAt: "2026-02-18T16:00:00.000Z",
  updatedAt: "2026-02-18T16:00:00.000Z",
};

const DEMO_PUBLIC_MEDIA_ASSETS: Record<"familyPacket" | "retreatChecklist", CmsMediaAsset> = {
  familyPacket: {
    altText: null,
    bucket: "public-demo",
    caption: "Representative local-development family registration packet.",
    createdAt: DEMO_MEDIA_ASSET_DATES.createdAt,
    id: "demo-family-packet",
    kind: "file",
    label: "2026-2027 family registration packet",
    mimeType: "text/plain",
    publicUrl: "/demo/2026-2027-family-registration-packet.txt",
    sizeBytes: null,
    storagePath: "public/demo/2026-2027-family-registration-packet.txt",
    updatedAt: DEMO_MEDIA_ASSET_DATES.updatedAt,
  },
  retreatChecklist: {
    altText: null,
    bucket: "public-demo",
    caption: "Representative local-development retreat checklist.",
    createdAt: DEMO_MEDIA_ASSET_DATES.createdAt,
    id: "demo-retreat-checklist",
    kind: "file",
    label: "Lenten retreat family checklist",
    mimeType: "text/plain",
    publicUrl: "/demo/lenten-retreat-family-checklist.txt",
    sizeBytes: null,
    storagePath: "public/demo/lenten-retreat-family-checklist.txt",
    updatedAt: DEMO_MEDIA_ASSET_DATES.updatedAt,
  },
};

function logCmsReadIssue(scope: string, error: unknown) {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.warn(`[cms] ${scope} unavailable`, error);
}

async function withCmsFallback<T>(scope: string, fallback: T, callback: () => Promise<T>) {
  if (!isDatabaseConfigured()) {
    return fallback;
  }

  try {
    return await callback();
  } catch (error) {
    logCmsReadIssue(scope, error);
    return fallback;
  }
}

function mapMediaAsset(row: CmsMediaAssetRow): CmsMediaAsset {
  return {
    altText: row.alt_text,
    bucket: row.bucket,
    caption: row.caption,
    createdAt: row.created_at,
    id: row.id,
    kind: row.kind,
    label: row.label,
    mimeType: row.mime_type,
    publicUrl: row.public_url,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    updatedAt: row.updated_at,
  };
}

function mapJoinedMediaAsset(
  row: {
    [key: string]: string | number | boolean | null;
  },
  prefix: string,
): CmsMediaAsset | null {
  const id = row[`${prefix}_id`];

  if (typeof id !== "string") {
    return null;
  }

  return {
    altText: typeof row[`${prefix}_alt_text`] === "string" ? (row[`${prefix}_alt_text`] as string) : null,
    bucket: String(row[`${prefix}_bucket`]),
    caption: typeof row[`${prefix}_caption`] === "string" ? (row[`${prefix}_caption`] as string) : null,
    createdAt: String(row[`${prefix}_created_at`]),
    id,
    kind: row[`${prefix}_kind`] as CmsMediaKind,
    label: String(row[`${prefix}_label`]),
    mimeType:
      typeof row[`${prefix}_mime_type`] === "string"
        ? (row[`${prefix}_mime_type`] as string)
        : null,
    publicUrl: String(row[`${prefix}_public_url`]),
    sizeBytes:
      typeof row[`${prefix}_size_bytes`] === "number"
        ? (row[`${prefix}_size_bytes`] as number)
        : null,
    storagePath: String(row[`${prefix}_storage_path`]),
    updatedAt: String(row[`${prefix}_updated_at`]),
  };
}

function mapAnnouncement(row: CmsAnnouncementRow): CmsAnnouncement {
  return {
    attachment: mapJoinedMediaAsset(row, "attachment"),
    audience: row.audience,
    bodyEn: row.body_en,
    bodyVi: row.body_vi,
    createdAt: row.created_at,
    id: row.id,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    slug: row.slug,
    status: row.status,
    summaryEn: row.summary_en,
    summaryVi: row.summary_vi,
    titleEn: row.title_en,
    titleVi: row.title_vi,
    updatedAt: row.updated_at,
  };
}

function mapPage(row: CmsPageRow): CmsPage {
  return {
    bodyEn: row.body_en,
    bodyVi: row.body_vi,
    createdAt: row.created_at,
    id: row.id,
    publishedAt: row.published_at,
    slug: row.slug,
    status: row.status,
    summaryEn: row.summary_en,
    summaryVi: row.summary_vi,
    titleEn: row.title_en,
    titleVi: row.title_vi,
    updatedAt: row.updated_at,
  };
}

function mapScheduleItem(row: CmsScheduleItemRow): CmsScheduleItem {
  return {
    actionHref: row.action_href,
    actionLabel: row.action_label,
    audience: row.audience,
    createdAt: row.created_at,
    dateLabelEn: row.date_label_en,
    dateLabelVi: row.date_label_vi,
    id: row.id,
    isFeatured: row.is_featured,
    noteEn: row.note_en,
    noteVi: row.note_vi,
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
    status: row.status,
    titleEn: row.title_en,
    titleVi: row.title_vi,
    updatedAt: row.updated_at,
  };
}

function mapResource(row: CmsResourceRow): CmsResource {
  return {
    audience: row.audience,
    availabilityLabel: row.availability_label,
    createdAt: row.created_at,
    descriptionEn: row.description_en,
    descriptionVi: row.description_vi,
    file: mapJoinedMediaAsset(row, "file"),
    id: row.id,
    isFeatured: row.is_featured,
    linkUrl: row.link_url,
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
    status: row.status,
    titleEn: row.title_en,
    titleVi: row.title_vi,
    updatedAt: row.updated_at,
  };
}

function getFallbackAnnouncements(): CmsAnnouncement[] {
  return announcementPreviews.map((announcement, index) => ({
    attachment:
      announcement.slug === "registration-packet-live"
        ? DEMO_PUBLIC_MEDIA_ASSETS.familyPacket
        : announcement.slug === "lenten-retreat-checklist"
          ? DEMO_PUBLIC_MEDIA_ASSETS.retreatChecklist
          : null,
    audience: announcement.audience,
    bodyEn: announcement.summary.en,
    bodyVi: announcement.summary.vi ?? null,
    createdAt: `2026-02-${String(index + 8).padStart(2, "0")}T16:00:00.000Z`,
    id: `fallback-announcement-${index + 1}`,
    isFeatured: index === 0,
    publishedAt: `2026-02-${String(index + 8).padStart(2, "0")}T16:00:00.000Z`,
    slug: announcement.slug,
    status: "published",
    summaryEn: announcement.summary.en,
    summaryVi: announcement.summary.vi ?? null,
    titleEn: announcement.title.en,
    titleVi: announcement.title.vi ?? null,
    updatedAt: `2026-02-${String(index + 8).padStart(2, "0")}T16:00:00.000Z`,
  }));
}

function getFallbackScheduleItems(): CmsScheduleItem[] {
  return [...weeklyRhythm, ...upcomingDates].map((item, index) => ({
    actionHref: null,
    actionLabel: null,
    audience: null,
    createdAt: `2026-02-${String(index + 1).padStart(2, "0")}T16:00:00.000Z`,
    dateLabelEn: item.dateLabel,
    dateLabelVi: null,
    id: `fallback-schedule-${index + 1}`,
    isFeatured: index >= weeklyRhythm.length,
    noteEn: item.note,
    noteVi: null,
    publishedAt: `2026-02-${String(index + 1).padStart(2, "0")}T16:00:00.000Z`,
    sortOrder: index,
    status: "published",
    titleEn: item.label,
    titleVi: null,
    updatedAt: `2026-02-${String(index + 1).padStart(2, "0")}T16:00:00.000Z`,
  }));
}

function getFallbackResources(): CmsResource[] {
  return resourcePreviews.map((resource, index) => ({
    audience: resource.audience,
    availabilityLabel: resource.availability,
    createdAt: `2026-02-${String(index + 18).padStart(2, "0")}T16:00:00.000Z`,
    descriptionEn: resource.description.en,
    descriptionVi: resource.description.vi ?? null,
    file:
      index === 0
        ? DEMO_PUBLIC_MEDIA_ASSETS.familyPacket
        : index === 1
          ? DEMO_PUBLIC_MEDIA_ASSETS.retreatChecklist
          : null,
    id: `fallback-resource-${index + 1}`,
    isFeatured: index === 0,
    linkUrl: index === 2 ? "https://example.com/family-handbook-summary" : null,
    publishedAt: `2026-02-${String(index + 18).padStart(2, "0")}T16:00:00.000Z`,
    sortOrder: index,
    status: "published",
    titleEn: resource.title.en,
    titleVi: resource.title.vi ?? null,
    updatedAt: `2026-02-${String(index + 18).padStart(2, "0")}T16:00:00.000Z`,
  }));
}

export function getFallbackManagedPage(slug: ManagedPageSlug): CmsPageEditorRecord {
  const fallback = FALLBACK_MANAGED_PAGES[slug];

  return {
    bodyEn: fallback.bodyEn,
    bodyVi: null,
    createdAt: "2026-02-01T16:00:00.000Z",
    exists: false,
    id: "",
    publishedAt: "2026-02-01T16:00:00.000Z",
    route: fallback.route,
    slug,
    status: "published",
    summaryEn: fallback.summaryEn,
    summaryVi: null,
    titleEn: fallback.titleEn,
    titleVi: null,
    updatedAt: "2026-02-01T16:00:00.000Z",
  };
}

function mergeManagedPages(records: CmsPage[]): CmsPageEditorRecord[] {
  const bySlug = new Map(records.map((record) => [record.slug, record]));

  return MANAGED_PAGE_SLUGS.map((slug) => {
    const record = bySlug.get(slug);

    if (!record) {
      return getFallbackManagedPage(slug);
    }

    return {
      ...record,
      exists: true,
      route: FALLBACK_MANAGED_PAGES[slug].route,
    };
  });
}

export async function listMediaAssetsForAdmin() {
  return withCmsFallback("list media assets", [] as CmsMediaAsset[], async () => {
    const result = await query<CmsMediaAssetRow>(`
      select
        id::text as id,
        label,
        kind::text as kind,
        bucket,
        storage_path,
        public_url,
        mime_type,
        size_bytes,
        alt_text,
        caption,
        created_at::text as created_at,
        updated_at::text as updated_at
      from public.cms_media_assets
      order by updated_at desc
    `);

    return result.rows.map(mapMediaAsset);
  });
}

export async function listAnnouncementsForAdmin() {
  return withCmsFallback("list announcements", [] as CmsAnnouncement[], async () => {
    const result = await query<CmsAnnouncementRow>(`
      select
        announcement.id::text as id,
        announcement.slug,
        announcement.title_en,
        announcement.title_vi,
        announcement.summary_en,
        announcement.summary_vi,
        announcement.body_en,
        announcement.body_vi,
        announcement.audience,
        announcement.status::text as status,
        announcement.is_featured,
        announcement.published_at::text as published_at,
        announcement.created_at::text as created_at,
        announcement.updated_at::text as updated_at,
        attachment.id::text as attachment_id,
        attachment.label as attachment_label,
        attachment.kind::text as attachment_kind,
        attachment.bucket as attachment_bucket,
        attachment.storage_path as attachment_storage_path,
        attachment.public_url as attachment_public_url,
        attachment.mime_type as attachment_mime_type,
        attachment.size_bytes as attachment_size_bytes,
        attachment.alt_text as attachment_alt_text,
        attachment.caption as attachment_caption,
        attachment.created_at::text as attachment_created_at,
        attachment.updated_at::text as attachment_updated_at
      from public.cms_announcements announcement
      left join public.cms_media_assets attachment
        on attachment.id = announcement.attachment_media_id
      order by announcement.is_featured desc, coalesce(announcement.published_at, announcement.updated_at) desc
    `);

    return result.rows.map(mapAnnouncement);
  });
}

export async function listPagesForAdmin() {
  return withCmsFallback("list managed pages", mergeManagedPages([]), async () => {
    const result = await query<CmsPageRow>(`
      select
        id::text as id,
        slug,
        title_en,
        title_vi,
        summary_en,
        summary_vi,
        body_en,
        body_vi,
        status::text as status,
        published_at::text as published_at,
        created_at::text as created_at,
        updated_at::text as updated_at
      from public.cms_pages
      order by
        case slug
          when 'home' then 0
          when 'about' then 1
          when 'contact' then 2
          else 99
        end,
        updated_at desc
    `);

    return mergeManagedPages(result.rows.map(mapPage));
  });
}

export async function listScheduleItemsForAdmin() {
  return withCmsFallback("list schedule items", [] as CmsScheduleItem[], async () => {
    const result = await query<CmsScheduleItemRow>(`
      select
        id::text as id,
        title_en,
        title_vi,
        date_label_en,
        date_label_vi,
        note_en,
        note_vi,
        audience,
        action_label,
        action_href,
        sort_order,
        status::text as status,
        is_featured,
        published_at::text as published_at,
        created_at::text as created_at,
        updated_at::text as updated_at
      from public.cms_schedule_items
      order by is_featured desc, sort_order asc, coalesce(published_at, updated_at) asc
    `);

    return result.rows.map(mapScheduleItem);
  });
}

export async function listResourcesForAdmin() {
  return withCmsFallback("list resources", [] as CmsResource[], async () => {
    const result = await query<CmsResourceRow>(`
      select
        resource.id::text as id,
        resource.title_en,
        resource.title_vi,
        resource.description_en,
        resource.description_vi,
        resource.audience,
        resource.availability_label,
        resource.link_url,
        resource.sort_order,
        resource.status::text as status,
        resource.is_featured,
        resource.published_at::text as published_at,
        resource.created_at::text as created_at,
        resource.updated_at::text as updated_at,
        file_asset.id::text as file_id,
        file_asset.label as file_label,
        file_asset.kind::text as file_kind,
        file_asset.bucket as file_bucket,
        file_asset.storage_path as file_storage_path,
        file_asset.public_url as file_public_url,
        file_asset.mime_type as file_mime_type,
        file_asset.size_bytes as file_size_bytes,
        file_asset.alt_text as file_alt_text,
        file_asset.caption as file_caption,
        file_asset.created_at::text as file_created_at,
        file_asset.updated_at::text as file_updated_at,
        file_asset.public_url as file_link_url
      from public.cms_resources resource
      left join public.cms_media_assets file_asset
        on file_asset.id = resource.file_media_id
      order by resource.is_featured desc, resource.sort_order asc, coalesce(resource.published_at, resource.updated_at) desc
    `);

    return result.rows.map(mapResource);
  });
}

export async function getPublishedAnnouncements(limit?: number) {
  const records = await withCmsFallback(
    "published announcements",
    [] as CmsAnnouncement[],
    async () => {
      const values: number[] = [];
      const limitClause =
        typeof limit === "number"
          ? (() => {
              values.push(limit);
              return `limit $${values.length}`;
            })()
          : "";

      const result = await query<CmsAnnouncementRow>(
        `
          select
            announcement.id::text as id,
            announcement.slug,
            announcement.title_en,
            announcement.title_vi,
            announcement.summary_en,
            announcement.summary_vi,
            announcement.body_en,
            announcement.body_vi,
            announcement.audience,
            announcement.status::text as status,
            announcement.is_featured,
            announcement.published_at::text as published_at,
            announcement.created_at::text as created_at,
            announcement.updated_at::text as updated_at,
            attachment.id::text as attachment_id,
            attachment.label as attachment_label,
            attachment.kind::text as attachment_kind,
            attachment.bucket as attachment_bucket,
            attachment.storage_path as attachment_storage_path,
            attachment.public_url as attachment_public_url,
            attachment.mime_type as attachment_mime_type,
            attachment.size_bytes as attachment_size_bytes,
            attachment.alt_text as attachment_alt_text,
            attachment.caption as attachment_caption,
            attachment.created_at::text as attachment_created_at,
            attachment.updated_at::text as attachment_updated_at
          from public.cms_announcements announcement
          left join public.cms_media_assets attachment
            on attachment.id = announcement.attachment_media_id
          where announcement.status = 'published'
          order by announcement.is_featured desc, announcement.published_at desc, announcement.updated_at desc
          ${limitClause}
        `,
        values,
      );

      return result.rows.map(mapAnnouncement);
    },
  );

  return records.length > 0 ? records : getFallbackAnnouncements();
}

export async function getPublishedScheduleItems() {
  const records = await withCmsFallback(
    "published schedule items",
    [] as CmsScheduleItem[],
    async () => {
      const result = await query<CmsScheduleItemRow>(`
        select
          id::text as id,
          title_en,
          title_vi,
          date_label_en,
          date_label_vi,
          note_en,
          note_vi,
          audience,
          action_label,
          action_href,
          sort_order,
          status::text as status,
          is_featured,
          published_at::text as published_at,
          created_at::text as created_at,
          updated_at::text as updated_at
        from public.cms_schedule_items
        where status = 'published'
        order by is_featured desc, sort_order asc, published_at asc, updated_at asc
      `);

      return result.rows.map(mapScheduleItem);
    },
  );

  return records.length > 0 ? records : getFallbackScheduleItems();
}

export async function getPublishedResources() {
  const records = await withCmsFallback(
    "published resources",
    [] as CmsResource[],
    async () => {
      const result = await query<CmsResourceRow>(`
        select
          resource.id::text as id,
          resource.title_en,
          resource.title_vi,
          resource.description_en,
          resource.description_vi,
          resource.audience,
          resource.availability_label,
          resource.link_url,
          resource.sort_order,
          resource.status::text as status,
          resource.is_featured,
          resource.published_at::text as published_at,
          resource.created_at::text as created_at,
          resource.updated_at::text as updated_at,
          file_asset.id::text as file_id,
          file_asset.label as file_label,
          file_asset.kind::text as file_kind,
          file_asset.bucket as file_bucket,
          file_asset.storage_path as file_storage_path,
          file_asset.public_url as file_public_url,
          file_asset.mime_type as file_mime_type,
          file_asset.size_bytes as file_size_bytes,
          file_asset.alt_text as file_alt_text,
          file_asset.caption as file_caption,
          file_asset.created_at::text as file_created_at,
          file_asset.updated_at::text as file_updated_at,
          file_asset.public_url as file_link_url
        from public.cms_resources resource
        left join public.cms_media_assets file_asset
          on file_asset.id = resource.file_media_id
        where resource.status = 'published'
        order by resource.is_featured desc, resource.sort_order asc, resource.published_at desc, resource.updated_at desc
      `);

      return result.rows.map(mapResource);
    },
  );

  return records.length > 0 ? records : getFallbackResources();
}

export async function getPublishedManagedPage(slug: ManagedPageSlug) {
  const record = await withCmsFallback(
    `published page ${slug}`,
    null as CmsPage | null,
    async () => {
      const result = await query<CmsPageRow>(
        `
          select
            id::text as id,
            slug,
            title_en,
            title_vi,
            summary_en,
            summary_vi,
            body_en,
            body_vi,
            status::text as status,
            published_at::text as published_at,
            created_at::text as created_at,
            updated_at::text as updated_at
          from public.cms_pages
          where slug = $1 and status = 'published'
          limit 1
        `,
        [slug],
      );

      return result.rows[0] ? mapPage(result.rows[0]) : null;
    },
  );

  if (record) {
    return record;
  }

  const fallback = FALLBACK_MANAGED_PAGES[slug];

  return {
    bodyEn: fallback.bodyEn,
    bodyVi: null,
    createdAt: "2026-02-01T16:00:00.000Z",
    id: "",
    publishedAt: "2026-02-01T16:00:00.000Z",
    slug,
    status: "published",
    summaryEn: fallback.summaryEn,
    summaryVi: null,
    titleEn: fallback.titleEn,
    titleVi: null,
    updatedAt: "2026-02-01T16:00:00.000Z",
  } satisfies CmsPage;
}

export async function getCmsDashboardSummary() {
  const [announcements, pages, scheduleItems, resources, mediaAssets] =
    await Promise.all([
      listAnnouncementsForAdmin(),
      listPagesForAdmin(),
      listScheduleItemsForAdmin(),
      listResourcesForAdmin(),
      listMediaAssetsForAdmin(),
    ]);

  return {
    announcements,
    mediaAssets,
    pages,
    resources,
    scheduleItems,
  };
}

export function getFallbackContactNotes() {
  return contactCards;
}
