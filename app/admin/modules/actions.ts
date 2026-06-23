"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/current-user";
import {
  createAdminModule,
  updateAdminModule,
  upsertAdminModuleChallenge
} from "@/lib/core/admin-management";

function moduleRedirect(status: string) {
  redirect(`/admin/modules?status=${status}`);
}

function requiredValue(value: FormDataEntryValue | null, fallback = "") {
  return String(value ?? fallback);
}

export async function createModuleAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "created";

  try {
    await createAdminModule({
      actorUserId: admin.id,
      input: {
        title: requiredValue(formData.get("title")),
        slug: requiredValue(formData.get("slug")),
        summary: requiredValue(formData.get("summary")),
        bodyMarkdown: requiredValue(formData.get("bodyMarkdown")),
        difficulty: requiredValue(formData.get("difficulty")),
        estimatedMinutes: requiredValue(formData.get("estimatedMinutes")),
        status: requiredValue(formData.get("status"), ContentStatus.DRAFT),
        tags: requiredValue(formData.get("tags"))
      }
    });
    revalidatePath("/admin/modules");
  } catch {
    status = "error";
  }

  moduleRedirect(status);
}

export async function updateModuleAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "updated";

  try {
    await updateAdminModule({
      actorUserId: admin.id,
      input: {
        moduleId: requiredValue(formData.get("moduleId")),
        title: requiredValue(formData.get("title")),
        slug: requiredValue(formData.get("slug")),
        summary: requiredValue(formData.get("summary")),
        bodyMarkdown: requiredValue(formData.get("bodyMarkdown")),
        difficulty: requiredValue(formData.get("difficulty")),
        estimatedMinutes: requiredValue(formData.get("estimatedMinutes")),
        status: requiredValue(formData.get("status"), ContentStatus.DRAFT),
        tags: requiredValue(formData.get("tags"))
      }
    });
    revalidatePath("/admin/modules");
  } catch {
    status = "error";
  }

  moduleRedirect(status);
}

export async function linkChallengeAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "linked";

  try {
    await upsertAdminModuleChallenge({
      actorUserId: admin.id,
      input: {
        moduleId: requiredValue(formData.get("moduleId")),
        challengeId: requiredValue(formData.get("challengeId")),
        sortOrder: requiredValue(formData.get("sortOrder"), "0"),
        required: formData.get("required") === "on"
      }
    });
    revalidatePath("/admin/modules");
    revalidatePath("/admin/challenges");
  } catch {
    status = "error";
  }

  moduleRedirect(status);
}
