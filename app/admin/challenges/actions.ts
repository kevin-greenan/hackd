"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChallengeType, ContentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/current-user";
import {
  createAdminChallenge,
  updateAdminChallenge
} from "@/lib/core/admin-management";

function challengeRedirect(status: string) {
  redirect(`/admin/challenges?status=${status}`);
}

function requiredValue(value: FormDataEntryValue | null, fallback = "") {
  return String(value ?? fallback);
}

export async function createChallengeAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "created";

  try {
    await createAdminChallenge({
      actorUserId: admin.id,
      input: {
        title: requiredValue(formData.get("title")),
        slug: requiredValue(formData.get("slug")),
        description: requiredValue(formData.get("description")),
        type: requiredValue(formData.get("type"), ChallengeType.STATIC_FLAG),
        difficulty: requiredValue(formData.get("difficulty")),
        points: requiredValue(formData.get("points"), "0"),
        status: requiredValue(formData.get("status"), ContentStatus.DRAFT),
        tags: requiredValue(formData.get("tags")),
        validationConfig: requiredValue(formData.get("validationConfig")),
        runtimeConfig: requiredValue(formData.get("runtimeConfig"))
      }
    });
    revalidatePath("/admin/challenges");
  } catch {
    status = "error";
  }

  challengeRedirect(status);
}

export async function updateChallengeAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "updated";

  try {
    await updateAdminChallenge({
      actorUserId: admin.id,
      input: {
        challengeId: requiredValue(formData.get("challengeId")),
        title: requiredValue(formData.get("title")),
        slug: requiredValue(formData.get("slug")),
        description: requiredValue(formData.get("description")),
        type: requiredValue(formData.get("type"), ChallengeType.STATIC_FLAG),
        difficulty: requiredValue(formData.get("difficulty")),
        points: requiredValue(formData.get("points"), "0"),
        status: requiredValue(formData.get("status"), ContentStatus.DRAFT),
        tags: requiredValue(formData.get("tags")),
        validationConfig: requiredValue(formData.get("validationConfig")),
        runtimeConfig: requiredValue(formData.get("runtimeConfig"))
      }
    });
    revalidatePath("/admin/challenges");
  } catch {
    status = "error";
  }

  challengeRedirect(status);
}
