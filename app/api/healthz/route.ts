import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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
