import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      app: "ok",
      database: "ok",
      timestamp: checkedAt
    });
  } catch (error) {
    logger.error("healthz.database_check_failed", {
      message: error instanceof Error ? error.message : "unknown"
    });

    return NextResponse.json(
      {
        app: "ok",
        database: "error",
        timestamp: checkedAt
      },
      { status: 503 }
    );
  }
}
