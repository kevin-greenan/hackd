"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role, UserStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/current-user";
import { createAdminUser, updateAdminUser } from "@/lib/core/admin-management";

function selectedGroupIds(formData: FormData) {
  return formData.getAll("groupIds").map((value) => String(value));
}

function adminUsersRedirect(status: string) {
  redirect(`/admin/users?status=${status}`);
}

export async function createUserAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "created";

  try {
    await createAdminUser({
      actorUserId: admin.id,
      input: {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        role: String(formData.get("role") ?? Role.LEARNER),
        status: String(formData.get("status") ?? UserStatus.ACTIVE),
        groupIds: selectedGroupIds(formData)
      }
    });
    revalidatePath("/admin/users");
  } catch {
    status = "error";
  }

  adminUsersRedirect(status);
}

export async function updateUserAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "updated";

  try {
    await updateAdminUser({
      actorUserId: admin.id,
      input: {
        userId: String(formData.get("userId") ?? ""),
        name: String(formData.get("name") ?? ""),
        role: String(formData.get("role") ?? Role.LEARNER),
        status: String(formData.get("status") ?? UserStatus.ACTIVE),
        groupIds: selectedGroupIds(formData)
      }
    });
    revalidatePath("/admin/users");
  } catch {
    status = "error";
  }

  adminUsersRedirect(status);
}
