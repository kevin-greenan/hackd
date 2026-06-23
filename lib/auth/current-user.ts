import { redirect } from "next/navigation";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getSessionFromCookies } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/rbac/roles";

export async function getCurrentUser() {
  const session = await getSessionFromCookies();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true
    }
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!canAccessAdmin(user.role)) {
    redirect("/dashboard?error=unauthorized");
  }

  return user;
}

export function isLearnerRole(role: Role) {
  return role === Role.LEARNER;
}
