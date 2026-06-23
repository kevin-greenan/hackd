import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { canAccessAdmin, canAccessLearnerArea, hasRole } from "@/lib/rbac/roles";

describe("rbac role helpers", () => {
  it("allows only admins into admin routes", () => {
    expect(canAccessAdmin(Role.ADMIN)).toBe(true);
    expect(canAccessAdmin(Role.LEARNER)).toBe(false);
  });

  it("allows authenticated platform roles into learner area", () => {
    expect(canAccessLearnerArea(Role.ADMIN)).toBe(true);
    expect(canAccessLearnerArea(Role.LEARNER)).toBe(true);
  });

  it("checks explicit allowed role lists", () => {
    expect(hasRole(Role.ADMIN, [Role.ADMIN])).toBe(true);
    expect(hasRole(Role.LEARNER, [Role.ADMIN])).toBe(false);
  });
});
