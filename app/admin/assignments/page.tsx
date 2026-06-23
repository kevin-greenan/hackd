import Link from "next/link";
import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { formatAdminLabel, getAdminAssignments } from "@/lib/core/admin-lists";

function formatDate(date: Date | null) {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default async function AdminAssignmentsPage() {
  const user = await requireAdmin();
  const assignments = await getAdminAssignments();

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Assignments</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Assignment queue</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review module assignments by user or group target before create/edit workflows land.
        </p>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Module", "Target", "Required", "Due", "Assigned by", "Created"]}
            emptyTitle="No assignments"
            emptyDescription="Assignment records will appear here after modules are assigned."
            rows={assignments.map((assignment) => [
              <div key="module">
                <Link
                  className="font-semibold text-teal-700 hover:text-teal-900"
                  href={`/modules/${assignment.module.slug}`}
                >
                  {assignment.module.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {assignment.module.slug} · {formatAdminLabel(assignment.module.status)}
                </p>
              </div>,
              <div key="target">
                <StatusBadge>{formatAdminLabel(assignment.target.type)}</StatusBadge>
                <p className="mt-2 font-semibold">{assignment.target.name}</p>
                <p className="text-xs text-muted-foreground">{assignment.target.detail}</p>
              </div>,
              <StatusBadge key="required" tone={assignment.required ? "success" : "neutral"}>
                {assignment.required ? "required" : "optional"}
              </StatusBadge>,
              <span key="due">{formatDate(assignment.dueAt)}</span>,
              assignment.assignedBy ? (
                <div key="assigned-by">
                  <p className="font-semibold">{assignment.assignedBy.name}</p>
                  <p className="text-xs text-muted-foreground">{assignment.assignedBy.email}</p>
                </div>
              ) : (
                <span className="text-muted-foreground" key="assigned-by">
                  Unknown
                </span>
              ),
              <span key="created">{formatDate(assignment.createdAt)}</span>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Assignment creation for users and groups is planned for the next Milestone 5 slice.
      </p>
    </AppShell>
  );
}
