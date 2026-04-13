import { describe, expect, it } from "vitest";
import { CMS_UPLOAD_MAX_BYTES, validateCmsUpload } from "./cms-upload";

describe("validateCmsUpload", () => {
  it("accepts supported files even when the browser reports a generic mime type", () => {
    const result = validateCmsUpload({
      name: "registration-packet.docx",
      size: 1024,
      type: "application/octet-stream",
    });

    expect(result).toEqual({
      normalizedMimeType: "application/msword",
      ok: true,
      storageExtension: "docx",
      storageKind: "file",
    });
  });

  it("rejects direct video uploads with a clear redirect-safe message", () => {
    const result = validateCmsUpload({
      name: "welcome.mp4",
      size: 2048,
      type: "video/mp4",
    });

    expect(result).toEqual({
      message:
        "Video uploads are not supported in the CMS yet. Add a YouTube or Vimeo link in the content instead of uploading the video file.",
      ok: false,
    });
  });

  it("rejects files above the shared size limit", () => {
    const result = validateCmsUpload({
      name: "campfire-loop.gif",
      size: CMS_UPLOAD_MAX_BYTES + 1,
      type: "image/gif",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.message).toContain("Upload files up to 25 MB.");
      expect(result.message).toContain('"campfire-loop.gif"');
    }
  });
});
