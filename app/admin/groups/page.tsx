import { AdminTable } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAdminGroups } from "@/lib/core/admin-lists";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default async function AdminGroupsPage() {
  const user = await requireAdmin();
  const groups = await getAdminGroups();

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Groups</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Group directory</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review learner groups, assignment targets, and membership counts.
        </p>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Group", "Description", "Members", "Assignments", "Created"]}
            emptyTitle="No groups"
            emptyDescription="Group records will appear here after groups are created."
            rows={groups.map((group) => [
              <div key="group">
                <p className="font-semibold">{group.name}</p>
                <p className="text-xs text-muted-foreground">{group.slug}</p>
              </div>,
              group.description ? (
                <span key="description">{group.description}</span>
              ) : (
                <span className="text-muted-foreground" key="description">
                  No description
                </span>
              ),
              <span className="font-semibold" key="members">
                {group.members}
              </span>,
              <span className="font-semibold" key="assignments">
                {group.assignments}
              </span>,
              <span key="created">{formatDate(group.createdAt)}</span>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Group creation and membership management are planned for the next Milestone 5 slice.
      </p>
    </AppShell>
  );
}
