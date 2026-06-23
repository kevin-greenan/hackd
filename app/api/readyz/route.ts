import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

function runnerHealthUrl() {
  const baseUrl = (process.env.RUNTIME_RUNNER_URL || "http://runner:4010").replace(/\/$/, "");

  return `${baseUrl}/healthz`;
}

async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

async function checkRunner() {
  const response = await fetch(runnerHealthUrl(), {
    cache: "no-store",
    signal: AbortSignal.timeout(2_000)
  });

  if (!response.ok) {
    throw new Error(`runner returned ${response.status}`);
  }
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const checks = {
    app: "ok",
    database: "ok",
    runner: "ok"
  };
  const failures: Record<string, string> = {};

  try {
    await checkDatabase();
  } catch (error) {
    checks.database = "error";
    failures.database = error instanceof Error ? error.message : "unknown";
  }

  try {
    await checkRunner();
  } catch (error) {
    checks.runner = "error";
    failures.runner = error instanceof Error ? error.message : "unknown";
  }

  if (Object.keys(failures).length > 0) {
    logger.error("readyz.check_failed", failures);
  }

  return NextResponse.json(
    {
      ...checks,
      timestamp: checkedAt
    },
    { status: Object.keys(failures).length > 0 ? 503 : 200 }
  );
}
