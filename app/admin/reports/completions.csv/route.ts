import { requireAdmin } from "@/lib/auth/current-user";
import { getCompletionCsv } from "@/lib/core/admin-reports";

export async function GET() {
  await requireAdmin();
  const csv = await getCompletionCsv();

  return new Response(csv, {
    headers: {
      "Content-Disposition": "attachment; filename=\"hackd-completions.csv\"",
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
