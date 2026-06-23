"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChallengeType, ContentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/current-user";
import { assertValidCsrfToken } from "@/lib/auth/csrf";
import {
  createChallengeAttachment,
  deleteChallengeAttachment
} from "@/lib/core/challenge-attachments";
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

function optionalLines(value: FormDataEntryValue | null) {
  return requiredValue(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function checkedValue(value: FormDataEntryValue | null) {
  return value === "on";
}

function optionRows(value: FormDataEntryValue | null) {
  return requiredValue(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, ...labelParts] = line.split("|");

      return {
        id: id.trim(),
        label: labelParts.join("|").trim()
      };
    })
    .filter((option) => option.id && option.label);
}

function challengeConfigs(formData: FormData) {
  const type = requiredValue(formData.get("type"), ChallengeType.STATIC_FLAG);

  if (type === ChallengeType.STATIC_FLAG) {
    return {
      runtimeConfig: "",
      validationConfig: JSON.stringify({
        type: "static_flag",
        flag: requiredValue(formData.get("staticFlag"))
      })
    };
  }

  if (type === ChallengeType.SHORT_ANSWER) {
    return {
      runtimeConfig: "",
      validationConfig: JSON.stringify({
        type: "exact_text",
        acceptedAnswers: optionalLines(formData.get("acceptedAnswers")),
        caseInsensitive: checkedValue(formData.get("caseInsensitive"))
      })
    };
  }

  if (type === ChallengeType.MULTIPLE_CHOICE) {
    return {
      runtimeConfig: "",
      validationConfig: JSON.stringify({
        type: "multiple_choice",
        allowMultiple: checkedValue(formData.get("allowMultiple")),
        options: optionRows(formData.get("choiceOptions")),
        correctOptionIds: optionalLines(formData.get("correctOptionIds"))
      })
    };
  }

  if (type === ChallengeType.DOCKER_WEB) {
    return {
      validationConfig: "",
      runtimeConfig: JSON.stringify({
        type: "docker_web",
        image: requiredValue(formData.get("dockerImage")),
        containerPort: Number(requiredValue(formData.get("containerPort"), "80")),
        memoryMb: Number(requiredValue(formData.get("memoryMb"), "128")),
        cpuCount: Number(requiredValue(formData.get("cpuCount"), "0.25")),
        ttlMinutes: Number(requiredValue(formData.get("ttlMinutes"), "30"))
      })
    };
  }

  return {
    runtimeConfig: "",
    validationConfig: ""
  };
}

export async function createChallengeAction(formData: FormData) {
  await assertValidCsrfToken(formData);
  const admin = await requireAdmin();
  let status = "created";

  try {
    const configs = challengeConfigs(formData);

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
        validationConfig: configs.validationConfig,
        runtimeConfig: configs.runtimeConfig
      }
    });
    revalidatePath("/admin/challenges");
  } catch {
    status = "error";
  }

  challengeRedirect(status);
}

export async function uploadChallengeAttachmentAction(formData: FormData) {
  await assertValidCsrfToken(formData);
  const admin = await requireAdmin();
  let status = "attached";

  try {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Attachment file is required.");
    }

    await createChallengeAttachment({
      actorUserId: admin.id,
      challengeId: requiredValue(formData.get("challengeId")),
      file
    });
    revalidatePath("/admin/challenges");
  } catch {
    status = "error";
  }

  challengeRedirect(status);
}

export async function deleteChallengeAttachmentAction(formData: FormData) {
  await assertValidCsrfToken(formData);
  const admin = await requireAdmin();
  let status = "attachment-deleted";

  try {
    await deleteChallengeAttachment({
      actorUserId: admin.id,
      attachmentId: requiredValue(formData.get("attachmentId"))
    });
    revalidatePath("/admin/challenges");
  } catch {
    status = "error";
  }

  challengeRedirect(status);
}

export async function updateChallengeAction(formData: FormData) {
  await assertValidCsrfToken(formData);
  const admin = await requireAdmin();
  let status = "updated";

  try {
    const configs = challengeConfigs(formData);

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
        validationConfig: configs.validationConfig,
        runtimeConfig: configs.runtimeConfig
      }
    });
    revalidatePath("/admin/challenges");
  } catch {
    status = "error";
  }

  challengeRedirect(status);
}
