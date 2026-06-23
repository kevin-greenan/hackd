import { Role } from "@prisma/client";

export function canAccessAdmin(role: Role) {
  return role === Role.ADMIN;
}

export function canAccessLearnerArea(role: Role) {
  return role === Role.ADMIN || role === Role.LEARNER;
}

export function hasRole(role: Role, allowedRoles: Role[]) {
  return allowedRoles.includes(role);
}
