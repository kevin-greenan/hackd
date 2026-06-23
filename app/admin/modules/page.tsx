import Link from "next/link";
import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { formatAdminLabel, getAdminModules } from "@/lib/core/admin-lists";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function statusTone(status: string): "neutral" | "success" | "warning" {
  return status === "PUBLISHED" ? "success" : status === "DRAFT" ? "warning" : "neutral";
}

export default async function AdminModulesPage() {
  const user = await requireAdmin();
  const modules = await getAdminModules();

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Modules</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Module catalog</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review module metadata, publication state, challenge links, and assignment coverage.
        </p>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Module", "Status", "Difficulty", "Tags", "Coverage", "Updated"]}
            emptyTitle="No modules"
            emptyDescription="Module records will appear here after modules are created."
            rows={modules.map((module) => [
              <div key="module">
                <Link className="font-semibold text-teal-700 hover:text-teal-900" href={`/modules/${module.slug}`}>
                  {module.title}
                </Link>
                <p className="text-xs text-muted-foreground">{module.slug}</p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">{module.summary}</p>
              </div>,
              <StatusBadge key="status" tone={statusTone(module.status)}>
                {formatAdminLabel(module.status)}
              </StatusBadge>,
              <div key="difficulty">
                <p className="font-semibold">{module.difficulty}</p>
                <p className="text-xs text-muted-foreground">
                  {module.estimatedMinutes ? `${module.estimatedMinutes} min` : "No estimate"}
                </p>
              </div>,
              module.tags.length > 0 ? (
                <span key="tags">{module.tags.join(", ")}</span>
              ) : (
                <span className="text-muted-foreground" key="tags">
                  None
                </span>
              ),
              <div key="coverage">
                <p>{module.challenges} challenges</p>
                <p className="text-xs text-muted-foreground">
                  {module.assignments} assignments, {module.completions} completions
                </p>
              </div>,
              <span key="updated">{formatDate(module.updatedAt)}</span>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Module create/edit and challenge association forms are planned for the next Milestone 5 slice.
      </p>
    </AppShell>
  );
}
