import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn()
  }
}));

vi.mock("@/lib/logging/logger", () => ({
  logger: {
    error: vi.fn()
  }
}));

const { prisma } = await import("@/lib/db/prisma");
const { logger } = await import("@/lib/logging/logger");
const { GET } = await import("@/app/api/healthz/route");

describe("health route", () => {
  it("returns ok when the database responds", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.app).toBe("ok");
    expect(body.database).toBe("ok");
  });

  it("returns unavailable when the database check fails", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("database unavailable"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.app).toBe("ok");
    expect(body.database).toBe("error");
    expect(logger.error).toHaveBeenCalledWith("healthz.database_check_failed", {
      message: "database unavailable"
    });
  });
});
