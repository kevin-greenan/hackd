"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { assertValidCsrfToken } from "@/lib/auth/csrf";
import { launchChallengeInstance, stopChallengeInstance } from "@/lib/core/challenge-runtime";
import { submitChallengeAnswer } from "@/lib/core/challenge-submissions";

function submissionRedirect(moduleSlug: string, challengeId: string, status: string) {
  redirect(`/modules/${moduleSlug}?challenge=${challengeId}&submission=${status}`);
}

function runtimeRedirect(moduleSlug: string, challengeId: string, status: string) {
  redirect(`/modules/${moduleSlug}?challenge=${challengeId}&runtime=${status}`);
}

export async function submitChallengeAction(formData: FormData) {
  await assertValidCsrfToken(formData);
  const user = await requireUser();
  const moduleSlug = String(formData.get("moduleSlug") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");
  const submittedValues = formData
    .getAll("submittedValue")
    .map((value) => String(value))
    .filter((value) => value.trim().length > 0);
  const submittedValue =
    submittedValues.length > 1 ? JSON.stringify(submittedValues) : (submittedValues[0] ?? "");

  if (!moduleSlug || !challengeId || !submittedValue.trim()) {
    submissionRedirect(moduleSlug || "unknown", challengeId || "unknown", "invalid");
  }

  try {
    const result = await submitChallengeAnswer({
      userId: user.id,
      role: user.role,
      moduleSlug,
      challengeId,
      submittedValue
    });

    revalidatePath(`/modules/${moduleSlug}`);
    revalidatePath("/dashboard");
    submissionRedirect(moduleSlug, challengeId, result.result === "CORRECT" ? "correct" : "incorrect");
  } catch {
    submissionRedirect(moduleSlug, challengeId, "error");
  }
}

export async function launchChallengeInstanceAction(formData: FormData) {
  await assertValidCsrfToken(formData);
  const user = await requireUser();
  const moduleSlug = String(formData.get("moduleSlug") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");

  if (!moduleSlug || !challengeId) {
    runtimeRedirect(moduleSlug || "unknown", challengeId || "unknown", "invalid");
  }

  try {
    await launchChallengeInstance({
      userId: user.id,
      role: user.role,
      moduleSlug,
      challengeId
    });

    revalidatePath(`/modules/${moduleSlug}`);
    runtimeRedirect(moduleSlug, challengeId, "running");
  } catch {
    runtimeRedirect(moduleSlug, challengeId, "error");
  }
}

export async function stopChallengeInstanceAction(formData: FormData) {
  await assertValidCsrfToken(formData);
  const user = await requireUser();
  const moduleSlug = String(formData.get("moduleSlug") ?? "");
  const challengeId = String(formData.get("challengeId") ?? "");
  const instanceId = String(formData.get("instanceId") ?? "");

  if (!moduleSlug || !challengeId || !instanceId) {
    runtimeRedirect(moduleSlug || "unknown", challengeId || "unknown", "invalid");
  }

  try {
    await stopChallengeInstance({
      userId: user.id,
      role: user.role,
      instanceId
    });

    revalidatePath(`/modules/${moduleSlug}`);
    runtimeRedirect(moduleSlug, challengeId, "stopped");
  } catch {
    runtimeRedirect(moduleSlug, challengeId, "error");
  }
}
