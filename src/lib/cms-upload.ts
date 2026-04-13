const BYTES_PER_MEGABYTE = 1024 * 1024;

export const CMS_UPLOAD_MAX_BYTES = 25 * BYTES_PER_MEGABYTE;
export const CMS_UPLOAD_SERVER_ACTION_BODY_SIZE_LIMIT = "100mb";

type SupportedUploadCategory = "document" | "image";
type KnownUnsupportedUploadCategory = "video";
type UploadCategory = SupportedUploadCategory | KnownUnsupportedUploadCategory;
type UploadDescriptor = {
  category: UploadCategory;
  extensions: string[];
  label: string;
  mimeTypes: string[];
};

type CmsUploadLike = {
  name: string;
  size: number;
  type?: string | null;
};

export type CmsUploadValidationResult =
  | {
      ok: true;
      normalizedMimeType: string | null;
      storageExtension: string;
      storageKind: "file" | "image";
    }
  | {
      message: string;
      ok: false;
    };

const SUPPORTED_UPLOADS: UploadDescriptor[] = [
  {
    category: "image",
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "avif"],
    label: "images",
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/avif",
    ],
  },
  {
    category: "document",
    extensions: ["pdf"],
    label: "PDFs",
    mimeTypes: ["application/pdf"],
  },
  {
    category: "document",
    extensions: ["doc", "docx"],
    label: "Word documents",
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  {
    category: "document",
    extensions: ["xls", "xlsx"],
    label: "Excel spreadsheets",
    mimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  {
    category: "document",
    extensions: ["ppt", "pptx"],
    label: "PowerPoint presentations",
    mimeTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
  {
    category: "document",
    extensions: ["csv"],
    label: "CSV files",
    mimeTypes: ["text/csv"],
  },
  {
    category: "document",
    extensions: ["txt"],
    label: "plain-text files",
    mimeTypes: ["text/plain"],
  },
];

const VIDEO_UPLOADS: UploadDescriptor[] = [
  {
    category: "video",
    extensions: ["mp4", "mov", "webm"],
    label: "videos",
    mimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
  },
];

const ALL_UPLOADS = [...SUPPORTED_UPLOADS, ...VIDEO_UPLOADS];
const GENERIC_MIME_TYPES = new Set(["application/octet-stream", "binary/octet-stream"]);
const ACCEPT_TOKENS = new Set<string>();

for (const upload of SUPPORTED_UPLOADS) {
  for (const extension of upload.extensions) {
    ACCEPT_TOKENS.add(`.${extension}`);
  }

  for (const mimeType of upload.mimeTypes) {
    ACCEPT_TOKENS.add(mimeType);
  }
}

export const CMS_UPLOAD_ACCEPT_ATTRIBUTE = Array.from(ACCEPT_TOKENS).join(",");
export const CMS_UPLOAD_HELP_TEXT =
  "Supported: JPG, PNG, GIF, WebP, AVIF, PDF, Word, Excel, PowerPoint, TXT, and CSV files up to 25 MB. Videos should be shared with a YouTube or Vimeo link instead of uploading them here.";

function normalizeMimeType(value?: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function getFileExtension(fileName: string) {
  const fromName = fileName.split(".").pop()?.trim().toLowerCase();
  return fromName && /^[a-z0-9]+$/.test(fromName) ? fromName : null;
}

function getUploadDescriptorByMimeType(mimeType: string | null) {
  if (!mimeType) {
    return null;
  }

  return ALL_UPLOADS.find((upload) => upload.mimeTypes.includes(mimeType)) ?? null;
}

function getUploadDescriptorByExtension(extension: string | null) {
  if (!extension) {
    return null;
  }

  return ALL_UPLOADS.find((upload) => upload.extensions.includes(extension)) ?? null;
}

function formatFileSize(bytes: number) {
  if (bytes >= BYTES_PER_MEGABYTE) {
    return `${Math.ceil((bytes / BYTES_PER_MEGABYTE) * 10) / 10} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.ceil((bytes / 1024) * 10) / 10} KB`;
  }

  return `${bytes} B`;
}

function getKnownVideoUploadMessage() {
  return "Video uploads are not supported in the CMS yet. Add a YouTube or Vimeo link in the content instead of uploading the video file.";
}

function getUnsupportedUploadMessage() {
  return "Unsupported file type. Upload an image, PDF, Word, Excel, PowerPoint, TXT, or CSV file. Videos should be linked from YouTube or Vimeo instead of uploaded directly.";
}

export function validateCmsUpload(file: CmsUploadLike): CmsUploadValidationResult {
  const mimeType = normalizeMimeType(file.type);
  const extension = getFileExtension(file.name);
  const descriptorByMimeType = getUploadDescriptorByMimeType(mimeType);
  const descriptorByExtension = getUploadDescriptorByExtension(extension);
  const genericMimeType = mimeType ? GENERIC_MIME_TYPES.has(mimeType) : true;
  const resolvedDescriptor =
    descriptorByMimeType ??
    (genericMimeType ? descriptorByExtension : null);

  if (descriptorByMimeType?.category === "video" || descriptorByExtension?.category === "video") {
    return {
      message: getKnownVideoUploadMessage(),
      ok: false,
    };
  }

  if (!resolvedDescriptor) {
    return {
      message: getUnsupportedUploadMessage(),
      ok: false,
    };
  }

  if (file.size > CMS_UPLOAD_MAX_BYTES) {
    return {
      message: `Upload files up to ${formatFileSize(CMS_UPLOAD_MAX_BYTES)}. "${file.name}" is ${formatFileSize(file.size)}.`,
      ok: false,
    };
  }

  return {
    normalizedMimeType:
      mimeType && !GENERIC_MIME_TYPES.has(mimeType)
        ? mimeType
        : resolvedDescriptor.mimeTypes[0] ?? null,
    ok: true,
    storageExtension:
      extension && resolvedDescriptor.extensions.includes(extension)
        ? extension
        : resolvedDescriptor.extensions[0] ?? "bin",
    storageKind: resolvedDescriptor.category === "image" ? "image" : "file",
  };
}
