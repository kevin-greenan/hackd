"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/current-user";
import {
  cleanupExpiredChallengeInstances,
  stopChallengeInstance
} from "@/lib/core/challenge-runtime";

function instancesRedirect(status: string) {
  redirect(`/admin/instances?status=${status}`);
}

export async function stopAdminChallengeInstanceAction(formData: FormData) {
  await requireAdmin();
  let status = "stopped";

  try {
    await stopChallengeInstance({
      role: Role.ADMIN,
      instanceId: String(formData.get("instanceId") ?? "")
    });
    revalidatePath("/admin/instances");
    revalidatePath("/admin");
  } catch {
    status = "error";
  }

  instancesRedirect(status);
}

export async function cleanupExpiredInstancesAction() {
  await requireAdmin();
  let status = "cleaned";

  try {
    await cleanupExpiredChallengeInstances();
    revalidatePath("/admin/instances");
    revalidatePath("/admin");
  } catch {
    status = "error";
  }

  instancesRedirect(status);
}
