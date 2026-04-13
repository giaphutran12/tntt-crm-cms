"use client";

import { useState } from "react";
import {
  CMS_UPLOAD_ACCEPT_ATTRIBUTE,
  CMS_UPLOAD_HELP_TEXT,
  validateCmsUpload,
} from "@/lib/cms-upload";

type CmsFileInputProps = {
  name: string;
  required?: boolean;
};

export function CmsFileInput({ name, required }: CmsFileInputProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <input
        accept={CMS_UPLOAD_ACCEPT_ATTRIBUTE}
        aria-invalid={errorMessage ? true : undefined}
        className="w-full rounded-[1rem] border border-[var(--line)] bg-white/85 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[rgba(164,61,47,0.12)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--accent-strong)] focus:border-[rgba(164,61,47,0.38)] focus:ring-2 focus:ring-[rgba(164,61,47,0.12)]"
        name={name}
        onChange={(event) => {
          const selectedFile = event.currentTarget.files?.[0];

          if (!selectedFile) {
            setErrorMessage(null);
            return;
          }

          const validation = validateCmsUpload(selectedFile);

          if (validation.ok) {
            setErrorMessage(null);
            return;
          }

          event.currentTarget.value = "";
          setErrorMessage(validation.message);
        }}
        required={required}
        type="file"
      />
      <p
        className={`text-xs ${errorMessage ? "text-[var(--accent-strong)]" : "text-[var(--muted)]"}`}
        role={errorMessage ? "alert" : undefined}
      >
        {errorMessage ?? CMS_UPLOAD_HELP_TEXT}
      </p>
    </div>
  );
}
