"use server";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MANAGED_PAGE_SLUGS, type ManagedPageSlug } from "@/lib/cms";
import { isDatabaseConfigured } from "@/lib/env";
import { requireMinimumRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOptionalServerEnv } from "@/lib/env";
import { getCheckedFormValue } from "@/lib/form-data";
import { query } from "@/server/db";

const contentStatusSchema = z.enum(["draft", "published"]);
const managedPageSlugSchema = z.enum(MANAGED_PAGE_SLUGS);

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

function getUploadedFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizeStorageSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.trim().toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  if (file.type === "application/pdf") {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return file.type.replace("image/", "") || "jpg";
  }

  return "bin";
}

async function requireEditorUser(path: string) {
  const access = await requireMinimumRole("editor", path);

  if (!access.authorized || access.reason !== "ok") {
    throw new Error("You do not have permission to manage CMS content.");
  }

  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required before CMS content can be managed.");
  }

  return access.currentUser;
}

function getCurrentTimestampForStatus(status: z.infer<typeof contentStatusSchema>) {
  return status === "published" ? new Date().toISOString() : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "The requested CMS action could not be completed.";
}

async function uploadPublicAsset(options: {
  altText?: string | null;
  caption?: string | null;
  file: File;
  folder: string;
  label: string;
  userId: string;
}) {
  const { SUPABASE_PUBLIC_MEDIA_BUCKET } = getOptionalServerEnv();
  const supabase = createSupabaseAdminClient();
  const extension = getFileExtension(options.file);
  const baseName = sanitizeStorageSegment(options.label || options.file.name || "asset");
  const storagePath = `${sanitizeStorageSegment(options.folder)}/${baseName}-${randomUUID()}.${extension}`;
  const fileBuffer = Buffer.from(await options.file.arrayBuffer());

  const uploadResult = await supabase.storage.from(SUPABASE_PUBLIC_MEDIA_BUCKET).upload(storagePath, fileBuffer, {
    cacheControl: "3600",
    contentType: options.file.type || undefined,
    upsert: false,
  });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message || "The uploaded file could not be stored.");
  }

  const publicUrlResult = supabase.storage.from(SUPABASE_PUBLIC_MEDIA_BUCKET).getPublicUrl(storagePath);
  const kind = options.file.type.startsWith("image/") ? "image" : "file";

  const insertResult = await query<{ id: string; public_url: string }>(
    `
      insert into public.cms_media_assets (
        label,
        kind,
        bucket,
        storage_path,
        public_url,
        mime_type,
        size_bytes,
        alt_text,
        caption,
        created_by
      )
      values ($1, $2::public.cms_media_kind, $3, $4, $5, $6, $7, $8, $9, $10)
      returning id::text as id, public_url
    `,
    [
      options.label,
      kind,
      SUPABASE_PUBLIC_MEDIA_BUCKET,
      storagePath,
      publicUrlResult.data.publicUrl,
      options.file.type || null,
      options.file.size,
      options.altText ?? null,
      options.caption ?? null,
      options.userId,
    ],
  );

  return {
    id: insertResult.rows[0].id,
    publicUrl: insertResult.rows[0].public_url,
  };
}

function revalidateCmsPaths(extraPaths: string[] = []) {
  const paths = new Set([
    "/",
    "/about",
    "/announcements",
    "/contact",
    "/forms-resources",
    "/schedule",
    "/admin",
    "/admin/announcements",
    "/admin/media",
    "/admin/pages",
    "/admin/resources",
    "/admin/schedule",
    ...extraPaths,
  ]);

  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function saveAnnouncementAction(formData: FormData) {
  const redirectPath = "/admin/announcements";

  try {
    const currentUser = await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");
    const titleEn = getTrimmedString(formData, "titleEn");

    if (!titleEn) {
      throw new Error("Announcement title is required.");
    }

    const status = contentStatusSchema.parse(getTrimmedString(formData, "status") || "draft");
    const slug = slugify(getTrimmedString(formData, "slug") || titleEn);

    if (!slug) {
      throw new Error("Announcement slug could not be generated.");
    }

    let attachmentId = getOptionalString(formData, "existingAttachmentId");
    const attachmentFile = getUploadedFile(formData, "attachmentFile");

    if (attachmentFile) {
      const attachment = await uploadPublicAsset({
        altText: getOptionalString(formData, "attachmentAltText"),
        caption: getOptionalString(formData, "attachmentCaption"),
        file: attachmentFile,
        folder: "announcements",
        label: getTrimmedString(formData, "attachmentLabel") || attachmentFile.name || `${titleEn} attachment`,
        userId: currentUser.id,
      });

      attachmentId = attachment.id;
    }

    const values = [
      slug,
      titleEn,
      getOptionalString(formData, "titleVi"),
      getTrimmedString(formData, "summaryEn"),
      getOptionalString(formData, "summaryVi"),
      getTrimmedString(formData, "bodyEn"),
      getOptionalString(formData, "bodyVi"),
      getOptionalString(formData, "audience"),
      status,
      getChecked(formData, "isFeatured"),
      attachmentId,
      getCurrentTimestampForStatus(status),
      currentUser.id,
    ];

    if (id) {
      await query(
        `
          update public.cms_announcements
          set
            slug = $2,
            title_en = $3,
            title_vi = $4,
            summary_en = $5,
            summary_vi = $6,
            body_en = $7,
            body_vi = $8,
            audience = $9,
            status = $10::public.cms_status,
            is_featured = $11,
            attachment_media_id = $12::uuid,
            published_at = case
              when $10::public.cms_status = 'published' then coalesce(published_at, $13::timestamptz)
              else null
            end,
            updated_by = $14
          where id = $1::uuid
        `,
        [id, ...values],
      );
    } else {
      await query(
        `
          insert into public.cms_announcements (
            slug,
            title_en,
            title_vi,
            summary_en,
            summary_vi,
            body_en,
            body_vi,
            audience,
            status,
            is_featured,
            attachment_media_id,
            published_at,
            created_by,
            updated_by
          )
          values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9::public.cms_status,
            $10,
            $11::uuid,
            $12::timestamptz,
            $13,
            $13
          )
        `,
        values,
      );
    }

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Announcement saved.");
}

export async function deleteAnnouncementAction(formData: FormData) {
  const redirectPath = "/admin/announcements";

  try {
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Announcement id is required.");
    }

    await query("delete from public.cms_announcements where id = $1::uuid", [id]);
    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Announcement deleted.");
}

export async function saveManagedPageAction(formData: FormData) {
  const redirectPath = "/admin/pages";

  try {
    const currentUser = await requireEditorUser(redirectPath);
    const slug = managedPageSlugSchema.parse(getTrimmedString(formData, "slug")) as ManagedPageSlug;
    const titleEn = getTrimmedString(formData, "titleEn");

    if (!titleEn) {
      throw new Error("Page title is required.");
    }

    const status = contentStatusSchema.parse(getTrimmedString(formData, "status") || "draft");

    await query(
      `
        insert into public.cms_pages (
          slug,
          title_en,
          title_vi,
          summary_en,
          summary_vi,
          body_en,
          body_vi,
          status,
          published_at,
          created_by,
          updated_by
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::public.cms_status, $9::timestamptz, $10, $10)
        on conflict (slug) do update
        set
          title_en = excluded.title_en,
          title_vi = excluded.title_vi,
          summary_en = excluded.summary_en,
          summary_vi = excluded.summary_vi,
          body_en = excluded.body_en,
          body_vi = excluded.body_vi,
          status = excluded.status,
          published_at = case
            when excluded.status = 'published' then coalesce(public.cms_pages.published_at, excluded.published_at)
            else null
          end,
          updated_by = excluded.updated_by
      `,
      [
        slug,
        titleEn,
        getOptionalString(formData, "titleVi"),
        getTrimmedString(formData, "summaryEn"),
        getOptionalString(formData, "summaryVi"),
        getTrimmedString(formData, "bodyEn"),
        getOptionalString(formData, "bodyVi"),
        status,
        getCurrentTimestampForStatus(status),
        currentUser.id,
      ],
    );

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Managed page saved.");
}

export async function saveScheduleItemAction(formData: FormData) {
  const redirectPath = "/admin/schedule";

  try {
    const currentUser = await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");
    const titleEn = getTrimmedString(formData, "titleEn");

    if (!titleEn) {
      throw new Error("Schedule title is required.");
    }

    const status = contentStatusSchema.parse(getTrimmedString(formData, "status") || "draft");
    const values = [
      titleEn,
      getOptionalString(formData, "titleVi"),
      getTrimmedString(formData, "dateLabelEn"),
      getOptionalString(formData, "dateLabelVi"),
      getTrimmedString(formData, "noteEn"),
      getOptionalString(formData, "noteVi"),
      getOptionalString(formData, "audience"),
      getOptionalString(formData, "actionLabel"),
      getOptionalString(formData, "actionHref"),
      getSortOrder(formData, "sortOrder"),
      status,
      getChecked(formData, "isFeatured"),
      getCurrentTimestampForStatus(status),
      currentUser.id,
    ];

    if (id) {
      await query(
        `
          update public.cms_schedule_items
          set
            title_en = $2,
            title_vi = $3,
            date_label_en = $4,
            date_label_vi = $5,
            note_en = $6,
            note_vi = $7,
            audience = $8,
            action_label = $9,
            action_href = $10,
            sort_order = $11,
            status = $12::public.cms_status,
            is_featured = $13,
            published_at = case
              when $12::public.cms_status = 'published' then coalesce(published_at, $14::timestamptz)
              else null
            end,
            updated_by = $15
          where id = $1::uuid
        `,
        [id, ...values],
      );
    } else {
      await query(
        `
          insert into public.cms_schedule_items (
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
            status,
            is_featured,
            published_at,
            created_by,
            updated_by
          )
          values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11::public.cms_status,
            $12,
            $13::timestamptz,
            $14,
            $14
          )
        `,
        values,
      );
    }

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Schedule item saved.");
}

export async function deleteScheduleItemAction(formData: FormData) {
  const redirectPath = "/admin/schedule";

  try {
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Schedule item id is required.");
    }

    await query("delete from public.cms_schedule_items where id = $1::uuid", [id]);
    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Schedule item deleted.");
}

export async function saveResourceAction(formData: FormData) {
  const redirectPath = "/admin/resources";

  try {
    const currentUser = await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");
    const titleEn = getTrimmedString(formData, "titleEn");

    if (!titleEn) {
      throw new Error("Resource title is required.");
    }

    const status = contentStatusSchema.parse(getTrimmedString(formData, "status") || "draft");
    let fileMediaId = getOptionalString(formData, "existingFileMediaId");
    const resourceFile = getUploadedFile(formData, "resourceFile");

    if (resourceFile) {
      const uploadedFile = await uploadPublicAsset({
        altText: null,
        caption: getOptionalString(formData, "fileCaption"),
        file: resourceFile,
        folder: "resources",
        label: getTrimmedString(formData, "fileLabel") || resourceFile.name || `${titleEn} file`,
        userId: currentUser.id,
      });

      fileMediaId = uploadedFile.id;
    }

    const values = [
      titleEn,
      getOptionalString(formData, "titleVi"),
      getTrimmedString(formData, "descriptionEn"),
      getOptionalString(formData, "descriptionVi"),
      getOptionalString(formData, "audience"),
      getOptionalString(formData, "availabilityLabel"),
      getOptionalString(formData, "linkUrl"),
      fileMediaId,
      getSortOrder(formData, "sortOrder"),
      status,
      getChecked(formData, "isFeatured"),
      getCurrentTimestampForStatus(status),
      currentUser.id,
    ];

    if (id) {
      await query(
        `
          update public.cms_resources
          set
            title_en = $2,
            title_vi = $3,
            description_en = $4,
            description_vi = $5,
            audience = $6,
            availability_label = $7,
            link_url = $8,
            file_media_id = $9::uuid,
            sort_order = $10,
            status = $11::public.cms_status,
            is_featured = $12,
            published_at = case
              when $11::public.cms_status = 'published' then coalesce(published_at, $13::timestamptz)
              else null
            end,
            updated_by = $14
          where id = $1::uuid
        `,
        [id, ...values],
      );
    } else {
      await query(
        `
          insert into public.cms_resources (
            title_en,
            title_vi,
            description_en,
            description_vi,
            audience,
            availability_label,
            link_url,
            file_media_id,
            sort_order,
            status,
            is_featured,
            published_at,
            created_by,
            updated_by
          )
          values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8::uuid,
            $9,
            $10::public.cms_status,
            $11,
            $12::timestamptz,
            $13,
            $13
          )
        `,
        values,
      );
    }

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Resource saved.");
}

export async function deleteResourceAction(formData: FormData) {
  const redirectPath = "/admin/resources";

  try {
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Resource id is required.");
    }

    await query("delete from public.cms_resources where id = $1::uuid", [id]);
    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Resource deleted.");
}

export async function saveMediaAssetAction(formData: FormData) {
  const redirectPath = "/admin/media";

  try {
    const currentUser = await requireEditorUser(redirectPath);
    const file = getUploadedFile(formData, "file");

    if (!file) {
      throw new Error("Choose a file to upload.");
    }

    await uploadPublicAsset({
      altText: getOptionalString(formData, "altText"),
      caption: getOptionalString(formData, "caption"),
      file,
      folder: getTrimmedString(formData, "folder") || "media",
      label: getTrimmedString(formData, "label") || file.name || "Untitled asset",
      userId: currentUser.id,
    });

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Media asset uploaded.");
}

export async function updateMediaAssetAction(formData: FormData) {
  const redirectPath = "/admin/media";

  try {
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Media asset id is required.");
    }

    const label = getTrimmedString(formData, "label");

    if (!label) {
      throw new Error("Media asset label is required.");
    }

    await query(
      `
        update public.cms_media_assets
        set
          label = $2,
          alt_text = $3,
          caption = $4
        where id = $1::uuid
      `,
      [id, label, getOptionalString(formData, "altText"), getOptionalString(formData, "caption")],
    );

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Media asset updated.");
}

export async function deleteMediaAssetAction(formData: FormData) {
  const redirectPath = "/admin/media";

  try {
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Media asset id is required.");
    }

    const assetLookup = await query<{ bucket: string; storage_path: string }>(
      `
        select bucket, storage_path
        from public.cms_media_assets
        where id = $1::uuid
        limit 1
      `,
      [id],
    );

    await query("delete from public.cms_media_assets where id = $1::uuid", [id]);

    const asset = assetLookup.rows[0];

    if (asset) {
      const supabase = createSupabaseAdminClient();
      await supabase.storage.from(asset.bucket).remove([asset.storage_path]);
    }

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Media asset deleted.");
}
