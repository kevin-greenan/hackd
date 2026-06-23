import { requireAdmin } from "@/lib/auth/current-user";
import { getCompletionCsv } from "@/lib/core/admin-reports";

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const csv = await getCompletionCsv({
    groupId: searchParams.get("groupId") ?? undefined,
    learnerId: searchParams.get("learnerId") ?? undefined,
    moduleId: searchParams.get("moduleId") ?? undefined
  });

  return new Response(csv, {
    headers: {
      "Content-Disposition": "attachment; filename=\"hackd-completions.csv\"",
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
