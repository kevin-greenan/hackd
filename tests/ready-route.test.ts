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
const { GET } = await import("@/app/api/readyz/route");

describe("readiness route", () => {
  it("returns ok when dependencies respond", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ runner: "ok" }), { status: 200 }))
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.app).toBe("ok");
    expect(body.database).toBe("ok");
    expect(body.runner).toBe("ok");
  });

  it("returns unavailable when a dependency fails", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("database unavailable"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ runner: "ok" }), { status: 200 }))
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.database).toBe("error");
    expect(body.runner).toBe("ok");
    expect(logger.error).toHaveBeenCalledWith("readyz.check_failed", {
      database: "database unavailable"
    });
  });
});
