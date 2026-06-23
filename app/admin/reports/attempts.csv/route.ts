import { requireAdmin } from "@/lib/auth/current-user";
import { getAttemptCsv } from "@/lib/core/admin-reports";

export async function GET() {
  await requireAdmin();
  const csv = await getAttemptCsv();

  return new Response(csv, {
    headers: {
      "Content-Disposition": "attachment; filename=\"hackd-attempts.csv\"",
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
