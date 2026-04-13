"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeRequestedStaffRole, updateStaffRole } from "@/lib/auth/staff-user-provisioning";
import { requireMinimumRole } from "@/lib/auth/session";

function redirectWithMessage(
  key: "error" | "notice",
  message: string,
) {
  redirect(`/admin/settings?${key}=${encodeURIComponent(message)}`);
}

function getTrimmedString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "The staff role change could not be completed.";
}

export async function updateStaffRoleAction(formData: FormData) {
  try {
    const access = await requireMinimumRole("admin", "/admin/settings");

    if (!access.authorized || access.reason !== "ok") {
      throw new Error("You do not have permission to manage staff roles.");
    }

    const subjectUserId = getTrimmedString(formData, "subjectUserId");
    const nextRole = normalizeRequestedStaffRole(getTrimmedString(formData, "nextRole"));
    const note = getTrimmedString(formData, "note");

    if (!subjectUserId || !nextRole) {
      throw new Error("Select a staff account and a valid role.");
    }

    const result = await updateStaffRole({
      actingUserId: access.currentUser.id,
      nextRole,
      note,
      subjectUserId,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/settings");

    if (!result.changed) {
      redirectWithMessage("notice", "Role already set. No changes were needed.");
    }
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  redirectWithMessage("notice", "Staff role updated.");
}
