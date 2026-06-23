import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { formatAdminLabel, getAdminUsers } from "@/lib/core/admin-lists";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  const users = await getAdminUsers();

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Users</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">User directory</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review local accounts, roles, group membership, and learner activity counts.
        </p>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["User", "Role", "Status", "Groups", "Activity", "Created"]}
            emptyTitle="No users"
            emptyDescription="User records will appear here after accounts are created."
            rows={users.map((adminUser) => [
              <div key="user">
                <p className="font-semibold">{adminUser.name}</p>
                <p className="text-xs text-muted-foreground">{adminUser.email}</p>
              </div>,
              <StatusBadge key="role">{formatAdminLabel(adminUser.role)}</StatusBadge>,
              <StatusBadge
                key="status"
                tone={adminUser.status === "ACTIVE" ? "success" : "warning"}
              >
                {formatAdminLabel(adminUser.status)}
              </StatusBadge>,
              adminUser.groups.length > 0 ? (
                <span key="groups">{adminUser.groups.join(", ")}</span>
              ) : (
                <span className="text-muted-foreground" key="groups">
                  None
                </span>
              ),
              <div key="activity">
                <p>{adminUser.assignments} assignments</p>
                <p className="text-xs text-muted-foreground">
                  {adminUser.attempts} attempts, {adminUser.completions} completions
                </p>
              </div>,
              <span key="created">{formatDate(adminUser.createdAt)}</span>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        User create and edit workflows are tracked for the next Milestone 5 slice.
      </p>
    </AppShell>
  );
}
