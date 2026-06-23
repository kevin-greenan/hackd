import { describe, expect, it } from "vitest";
import { formatCsvRows, normalizeAdminReportFilters } from "@/lib/core/admin-reports";

describe("admin report CSV formatting", () => {
  it("quotes and escapes every CSV value", () => {
    expect(
      formatCsvRows(
        ["name", "note", "created_at"],
        [["Learner, One", "said \"hello\"", new Date("2026-07-01T00:00:00.000Z")]]
      )
    ).toBe(
      "\"name\",\"note\",\"created_at\"\n\"Learner, One\",\"said \"\"hello\"\"\",\"2026-07-01T00:00:00.000Z\""
    );
  });

  it("normalizes empty report filters", () => {
    expect(
      normalizeAdminReportFilters({
        groupId: " group-1 ",
        learnerId: "",
        moduleId: "   "
      })
    ).toEqual({
      groupId: "group-1",
      learnerId: undefined,
      moduleId: undefined
    });
  });
});
