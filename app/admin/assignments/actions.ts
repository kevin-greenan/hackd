"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/current-user";
import {
  createAdminAssignment,
  deleteAdminAssignment,
  updateAdminAssignment
} from "@/lib/core/admin-management";

function assignmentRedirect(status: string) {
  redirect(`/admin/assignments?status=${status}`);
}

function requiredValue(value: FormDataEntryValue | null, fallback = "") {
  return String(value ?? fallback);
}

function checkedValue(value: FormDataEntryValue | null) {
  return value === "on";
}

function targetValue(value: FormDataEntryValue | null) {
  const [targetType, targetId] = requiredValue(value).split(":");

  return {
    targetType,
    targetId
  };
}

export async function createAssignmentAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "created";

  try {
    const target = targetValue(formData.get("target"));

    await createAdminAssignment({
      actorUserId: admin.id,
      input: {
        moduleId: requiredValue(formData.get("moduleId")),
        targetType: target.targetType,
        targetId: target.targetId,
        dueAt: requiredValue(formData.get("dueAt")),
        required: checkedValue(formData.get("required"))
      }
    });
    revalidatePath("/admin/assignments");
    revalidatePath("/dashboard");
  } catch {
    status = "error";
  }

  assignmentRedirect(status);
}

export async function updateAssignmentAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "updated";

  try {
    const target = targetValue(formData.get("target"));

    await updateAdminAssignment({
      actorUserId: admin.id,
      input: {
        assignmentId: requiredValue(formData.get("assignmentId")),
        moduleId: requiredValue(formData.get("moduleId")),
        targetType: target.targetType,
        targetId: target.targetId,
        dueAt: requiredValue(formData.get("dueAt")),
        required: checkedValue(formData.get("required"))
      }
    });
    revalidatePath("/admin/assignments");
    revalidatePath("/dashboard");
  } catch {
    status = "error";
  }

  assignmentRedirect(status);
}

export async function deleteAssignmentAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "deleted";

  try {
    await deleteAdminAssignment({
      actorUserId: admin.id,
      assignmentId: requiredValue(formData.get("assignmentId"))
    });
    revalidatePath("/admin/assignments");
    revalidatePath("/dashboard");
  } catch {
    status = "error";
  }

  assignmentRedirect(status);
}
