"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/current-user";
import {
  createAdminGroup,
  deleteAdminGroup,
  updateAdminGroup
} from "@/lib/core/admin-management";

function adminGroupsRedirect(status: string) {
  redirect(`/admin/groups?status=${status}`);
}

export async function createGroupAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "created";

  try {
    await createAdminGroup({
      actorUserId: admin.id,
      input: {
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? "")
      }
    });
    revalidatePath("/admin/groups");
  } catch {
    status = "error";
  }

  adminGroupsRedirect(status);
}

export async function updateGroupAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "updated";

  try {
    await updateAdminGroup({
      actorUserId: admin.id,
      input: {
        groupId: String(formData.get("groupId") ?? ""),
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? "")
      }
    });
    revalidatePath("/admin/groups");
  } catch {
    status = "error";
  }

  adminGroupsRedirect(status);
}

export async function deleteGroupAction(formData: FormData) {
  const admin = await requireAdmin();
  let status = "deleted";

  try {
    await deleteAdminGroup({
      actorUserId: admin.id,
      groupId: String(formData.get("groupId") ?? "")
    });
    revalidatePath("/admin/groups");
  } catch {
    status = "error";
  }

  adminGroupsRedirect(status);
}
