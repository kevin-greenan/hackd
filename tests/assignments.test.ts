import { describe, expect, it } from "vitest";
import { normalizeAssignmentTarget } from "@/lib/core/assignments";

describe("assignment target rules", () => {
  it("accepts a user target", () => {
    expect(normalizeAssignmentTarget({ userId: "user-1" })).toEqual({ userId: "user-1" });
  });

  it("accepts a group target", () => {
    expect(normalizeAssignmentTarget({ groupId: "group-1" })).toEqual({ groupId: "group-1" });
  });

  it("rejects missing targets", () => {
    expect(() => normalizeAssignmentTarget({})).toThrow("exactly one user or group");
  });

  it("rejects dual targets", () => {
    expect(() => normalizeAssignmentTarget({ userId: "user-1", groupId: "group-1" })).toThrow(
      "exactly one user or group"
    );
  });
});
