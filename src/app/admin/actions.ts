"use server";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MANAGED_PAGE_SLUGS, type ManagedPageSlug } from "@/lib/cms";
import { isCmsConfigured } from "@/lib/env";
import { requireMinimumRole } from "@/lib/auth/session";
import { provisionStaffUser } from "@/lib/auth/staff-user-provisioning";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOptionalServerEnv } from "@/lib/env";
import { getCheckedFormValue } from "@/lib/form-data";
import { validateCmsUpload } from "@/lib/cms-upload";

const contentStatusSchema = z.enum(["draft", "published"]);
const managedPageSlugSchema = z.enum(MANAGED_PAGE_SLUGS);
type ContentStatus = z.infer<typeof contentStatusSchema>;
type CmsTableWithPublishedAt =
  | "cms_announcements"
  | "cms_pages"
  | "cms_resources"
  | "cms_schedule_items";
type UploadedPublicAsset = {
  bucket: string;
  id: string;
  publicUrl: string;
  storagePath: string;
};

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

function getFileExtension(file: File, mimeType?: string | null) {
  const fromName = file.name.split(".").pop()?.trim().toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  const effectiveMimeType = mimeType ?? file.type;

  if (effectiveMimeType === "application/pdf") {
    return "pdf";
  }

  if (effectiveMimeType?.startsWith("image/")) {
    return effectiveMimeType.replace("image/", "") || "jpg";
  }

  switch (effectiveMimeType) {
    case "application/msword":
      return "doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "application/vnd.ms-excel":
      return "xls";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    case "application/vnd.ms-powerpoint":
      return "ppt";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return "pptx";
    case "text/csv":
      return "csv";
    case "text/plain":
      return "txt";
  }

  return "bin";
}

async function requireEditorUser(path: string) {
  const access = await requireMinimumRole("editor", path);

  if (!access.authorized || access.reason !== "ok") {
    throw new Error("You do not have permission to manage CMS content.");
  }

  if (!isCmsConfigured()) {
    throw new Error(
      "Supabase URL, publishable key, and service role key are required before CMS content can be managed.",
    );
  }

  await provisionStaffUser({
    email: access.currentUser.email,
    fullName: access.currentUser.name,
    role: access.currentUser.role,
    userId: access.currentUser.id,
  });

  return access.currentUser;
}

function getCurrentTimestampForStatus(status: ContentStatus) {
  return status === "published" ? new Date().toISOString() : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "The requested CMS action could not be completed.";
}

function getCmsClient() {
  return createSupabaseAdminClient();
}

type SupabaseErrorLike = {
  code?: string;
  message: string;
} | null;

function isDuplicateKeySupabaseError(error: SupabaseErrorLike) {
  return error?.code === "23505";
}

function throwIfSupabaseError(
  error: SupabaseErrorLike,
  fallbackMessage: string,
) {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

async function getExistingPublishedAt(
  table: CmsTableWithPublishedAt,
  match: { column: "id" | "slug"; value: string },
) {
  const supabase = getCmsClient();
  const { data, error } = await supabase
    .from(table)
    .select("published_at")
    .eq(match.column, match.value)
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError(error, `The existing ${table} record could not be loaded.`);

  return typeof data?.published_at === "string" ? data.published_at : null;
}

async function cleanupUploadedPublicAsset(
  asset: UploadedPublicAsset,
  options?: { throwOnError?: boolean },
) {
  const supabase = getCmsClient();
  const { error: deleteMetadataError } = await supabase
    .from("cms_media_assets")
    .delete()
    .eq("id", asset.id);

  if (deleteMetadataError) {
    if (options?.throwOnError) {
      throw new Error(
        deleteMetadataError.message || "The uploaded asset could not be cleaned up.",
      );
    }

    if (process.env.NODE_ENV !== "test") {
      console.warn("[cms] uploaded asset cleanup failed", deleteMetadataError);
    }

    return;
  }

  const { error: removeStorageError } = await supabase.storage
    .from(asset.bucket)
    .remove([asset.storagePath]);

  if (removeStorageError && options?.throwOnError) {
    throw new Error(removeStorageError.message || "The uploaded asset could not be cleaned up.");
  }

  if (removeStorageError && !options?.throwOnError && process.env.NODE_ENV !== "test") {
    console.warn("[cms] uploaded asset cleanup failed", removeStorageError);
  }
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
  const supabase = getCmsClient();
  const validation = validateCmsUpload(options.file);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const mimeType = validation.normalizedMimeType;
  const extension = validation.storageExtension || getFileExtension(options.file, mimeType);
  const baseName = sanitizeStorageSegment(options.label || options.file.name || "asset");
  const storagePath = `${sanitizeStorageSegment(options.folder)}/${baseName}-${randomUUID()}.${extension}`;
  const fileBuffer = Buffer.from(await options.file.arrayBuffer());

  const uploadResult = await supabase.storage.from(SUPABASE_PUBLIC_MEDIA_BUCKET).upload(storagePath, fileBuffer, {
    cacheControl: "3600",
    contentType: mimeType ?? undefined,
    upsert: false,
  });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message || "The uploaded file could not be stored.");
  }

  const publicUrlResult = supabase.storage.from(SUPABASE_PUBLIC_MEDIA_BUCKET).getPublicUrl(storagePath);
  const kind = validation.storageKind;

  const { data, error } = await supabase
    .from("cms_media_assets")
    .insert({
      alt_text: options.altText ?? null,
      bucket: SUPABASE_PUBLIC_MEDIA_BUCKET,
      caption: options.caption ?? null,
      created_by: options.userId,
      kind,
      label: options.label,
      mime_type: mimeType,
      public_url: publicUrlResult.data.publicUrl,
      size_bytes: options.file.size,
      storage_path: storagePath,
    })
    .select("id, public_url")
    .single();

  if (error) {
    await supabase.storage.from(SUPABASE_PUBLIC_MEDIA_BUCKET).remove([storagePath]);
    throw new Error(error.message || "The uploaded file metadata could not be saved.");
  }

  return {
    bucket: SUPABASE_PUBLIC_MEDIA_BUCKET,
    id: data.id,
    publicUrl: data.public_url,
    storagePath,
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
    const supabase = getCmsClient();
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
    let uploadedAttachment: UploadedPublicAsset | null = null;

    if (attachmentFile) {
      const attachment = await uploadPublicAsset({
        altText: getOptionalString(formData, "attachmentAltText"),
        caption: getOptionalString(formData, "attachmentCaption"),
        file: attachmentFile,
        folder: "announcements",
        label: getTrimmedString(formData, "attachmentLabel") || attachmentFile.name || `${titleEn} attachment`,
        userId: currentUser.id,
      });

      uploadedAttachment = attachment;
      attachmentId = attachment.id;
    }

    const payload = {
      attachment_media_id: attachmentId,
      audience: getOptionalString(formData, "audience"),
      body_en: getTrimmedString(formData, "bodyEn"),
      body_vi: getOptionalString(formData, "bodyVi"),
      is_featured: getChecked(formData, "isFeatured"),
      published_at: id
        ? status === "published"
          ? (await getExistingPublishedAt("cms_announcements", { column: "id", value: id })) ??
            getCurrentTimestampForStatus(status)
          : null
        : getCurrentTimestampForStatus(status),
      slug,
      status,
      summary_en: getTrimmedString(formData, "summaryEn"),
      summary_vi: getOptionalString(formData, "summaryVi"),
      title_en: titleEn,
      title_vi: getOptionalString(formData, "titleVi"),
      updated_by: currentUser.id,
    };

    try {
      if (id) {
        const { error } = await supabase
          .from("cms_announcements")
          .update(payload)
          .eq("id", id);

        throwIfSupabaseError(error, "The announcement could not be updated.");
      } else {
        const { error } = await supabase.from("cms_announcements").insert({
          ...payload,
          created_by: currentUser.id,
        });

        throwIfSupabaseError(error, "The announcement could not be created.");
      }
    } catch (error) {
      if (uploadedAttachment) {
        await cleanupUploadedPublicAsset(uploadedAttachment);
      }

      throw error;
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
    const supabase = getCmsClient();
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Announcement id is required.");
    }

    const { error } = await supabase.from("cms_announcements").delete().eq("id", id);
    throwIfSupabaseError(error, "The announcement could not be deleted.");
    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Announcement deleted.");
}

export async function saveManagedPageAction(formData: FormData) {
  const redirectPath = "/admin/pages";

  try {
    const supabase = getCmsClient();
    const currentUser = await requireEditorUser(redirectPath);
    const slug = managedPageSlugSchema.parse(getTrimmedString(formData, "slug")) as ManagedPageSlug;
    const titleEn = getTrimmedString(formData, "titleEn");

    if (!titleEn) {
      throw new Error("Page title is required.");
    }

    const status = contentStatusSchema.parse(getTrimmedString(formData, "status") || "draft");
    const existingPublishedAt =
      status === "published"
        ? (await getExistingPublishedAt("cms_pages", { column: "slug", value: slug })) ??
          getCurrentTimestampForStatus(status)
        : null;
    const payload = {
      body_en: getTrimmedString(formData, "bodyEn"),
      body_vi: getOptionalString(formData, "bodyVi"),
      published_at: existingPublishedAt,
      slug,
      status,
      summary_en: getTrimmedString(formData, "summaryEn"),
      summary_vi: getOptionalString(formData, "summaryVi"),
      title_en: titleEn,
      title_vi: getOptionalString(formData, "titleVi"),
      updated_by: currentUser.id,
    };
    const { data: existingPage, error: existingPageError } = await supabase
      .from("cms_pages")
      .select("id")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    throwIfSupabaseError(existingPageError, "The managed page could not be loaded.");

    if (existingPage) {
      const { error } = await supabase.from("cms_pages").update(payload).eq("id", existingPage.id);
      throwIfSupabaseError(error, "The managed page could not be updated.");
    } else {
      const { error } = await supabase.from("cms_pages").insert({
        ...payload,
        created_by: currentUser.id,
      });

      if (isDuplicateKeySupabaseError(error)) {
        const retryPublishedAt =
          status === "published"
            ? (await getExistingPublishedAt("cms_pages", { column: "slug", value: slug })) ??
              getCurrentTimestampForStatus(status)
            : null;
        const { error: retryUpdateError } = await supabase
          .from("cms_pages")
          .update({
            ...payload,
            published_at: retryPublishedAt,
          })
          .eq("slug", slug);
        throwIfSupabaseError(retryUpdateError, "The managed page could not be updated.");
      } else {
        throwIfSupabaseError(error, "The managed page could not be created.");
      }
    }

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Managed page saved.");
}

export async function saveScheduleItemAction(formData: FormData) {
  const redirectPath = "/admin/schedule";

  try {
    const supabase = getCmsClient();
    const currentUser = await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");
    const titleEn = getTrimmedString(formData, "titleEn");

    if (!titleEn) {
      throw new Error("Schedule title is required.");
    }

    const status = contentStatusSchema.parse(getTrimmedString(formData, "status") || "draft");
    const payload = {
      action_href: getOptionalString(formData, "actionHref"),
      action_label: getOptionalString(formData, "actionLabel"),
      audience: getOptionalString(formData, "audience"),
      date_label_en: getTrimmedString(formData, "dateLabelEn"),
      date_label_vi: getOptionalString(formData, "dateLabelVi"),
      is_featured: getChecked(formData, "isFeatured"),
      note_en: getTrimmedString(formData, "noteEn"),
      note_vi: getOptionalString(formData, "noteVi"),
      published_at: id
        ? status === "published"
          ? (await getExistingPublishedAt("cms_schedule_items", { column: "id", value: id })) ??
            getCurrentTimestampForStatus(status)
          : null
        : getCurrentTimestampForStatus(status),
      sort_order: getSortOrder(formData, "sortOrder"),
      status,
      title_en: titleEn,
      title_vi: getOptionalString(formData, "titleVi"),
      updated_by: currentUser.id,
    };

    if (id) {
      const { error } = await supabase.from("cms_schedule_items").update(payload).eq("id", id);
      throwIfSupabaseError(error, "The schedule item could not be updated.");
    } else {
      const { error } = await supabase.from("cms_schedule_items").insert({
        ...payload,
        created_by: currentUser.id,
      });
      throwIfSupabaseError(error, "The schedule item could not be created.");
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
    const supabase = getCmsClient();
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Schedule item id is required.");
    }

    const { error } = await supabase.from("cms_schedule_items").delete().eq("id", id);
    throwIfSupabaseError(error, "The schedule item could not be deleted.");
    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Schedule item deleted.");
}

export async function saveResourceAction(formData: FormData) {
  const redirectPath = "/admin/resources";

  try {
    const supabase = getCmsClient();
    const currentUser = await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");
    const titleEn = getTrimmedString(formData, "titleEn");

    if (!titleEn) {
      throw new Error("Resource title is required.");
    }

    const status = contentStatusSchema.parse(getTrimmedString(formData, "status") || "draft");
    let fileMediaId = getOptionalString(formData, "existingFileMediaId");
    const resourceFile = getUploadedFile(formData, "resourceFile");
    let uploadedFileAsset: UploadedPublicAsset | null = null;

    if (resourceFile) {
      const uploadedFile = await uploadPublicAsset({
        altText: null,
        caption: getOptionalString(formData, "fileCaption"),
        file: resourceFile,
        folder: "resources",
        label: getTrimmedString(formData, "fileLabel") || resourceFile.name || `${titleEn} file`,
        userId: currentUser.id,
      });

      uploadedFileAsset = uploadedFile;
      fileMediaId = uploadedFile.id;
    }

    const payload = {
      audience: getOptionalString(formData, "audience"),
      availability_label: getOptionalString(formData, "availabilityLabel"),
      description_en: getTrimmedString(formData, "descriptionEn"),
      description_vi: getOptionalString(formData, "descriptionVi"),
      file_media_id: fileMediaId,
      is_featured: getChecked(formData, "isFeatured"),
      link_url: getOptionalString(formData, "linkUrl"),
      published_at: id
        ? status === "published"
          ? (await getExistingPublishedAt("cms_resources", { column: "id", value: id })) ??
            getCurrentTimestampForStatus(status)
          : null
        : getCurrentTimestampForStatus(status),
      sort_order: getSortOrder(formData, "sortOrder"),
      status,
      title_en: titleEn,
      title_vi: getOptionalString(formData, "titleVi"),
      updated_by: currentUser.id,
    };

    try {
      if (id) {
        const { error } = await supabase.from("cms_resources").update(payload).eq("id", id);
        throwIfSupabaseError(error, "The resource could not be updated.");
      } else {
        const { error } = await supabase.from("cms_resources").insert({
          ...payload,
          created_by: currentUser.id,
        });
        throwIfSupabaseError(error, "The resource could not be created.");
      }
    } catch (error) {
      if (uploadedFileAsset) {
        await cleanupUploadedPublicAsset(uploadedFileAsset);
      }

      throw error;
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
    const supabase = getCmsClient();
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Resource id is required.");
    }

    const { error } = await supabase.from("cms_resources").delete().eq("id", id);
    throwIfSupabaseError(error, "The resource could not be deleted.");
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
    const supabase = getCmsClient();
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Media asset id is required.");
    }

    const label = getTrimmedString(formData, "label");

    if (!label) {
      throw new Error("Media asset label is required.");
    }

    const { error } = await supabase
      .from("cms_media_assets")
      .update({
        alt_text: getOptionalString(formData, "altText"),
        caption: getOptionalString(formData, "caption"),
        label,
      })
      .eq("id", id);
    throwIfSupabaseError(error, "The media asset could not be updated.");

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Media asset updated.");
}

export async function deleteMediaAssetAction(formData: FormData) {
  const redirectPath = "/admin/media";

  try {
    const supabase = getCmsClient();
    await requireEditorUser(redirectPath);
    const id = getTrimmedString(formData, "id");

    if (!id) {
      throw new Error("Media asset id is required.");
    }

    const { data: asset, error: lookupError } = await supabase
      .from("cms_media_assets")
      .select("id,bucket,storage_path,public_url")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    throwIfSupabaseError(lookupError, "The media asset could not be loaded.");

    if (asset) {
      await cleanupUploadedPublicAsset(
        {
          bucket: asset.bucket,
          id: asset.id,
          publicUrl: asset.public_url,
          storagePath: asset.storage_path,
        },
        { throwOnError: true },
      );
    } else {
      const { error } = await supabase.from("cms_media_assets").delete().eq("id", id);
      throwIfSupabaseError(error, "The media asset could not be deleted.");
    }

    revalidateCmsPaths();
  } catch (error) {
    redirectWithMessage(redirectPath, "error", getErrorMessage(error));
  }

  redirectWithMessage(redirectPath, "notice", "Media asset deleted.");
}
