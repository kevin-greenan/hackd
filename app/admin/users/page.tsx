import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { CsrfField } from "@/components/csrf-field";
import { requireAdmin } from "@/lib/auth/current-user";
import { formatAdminLabel, getAdminGroups, getAdminUsers } from "@/lib/core/admin-lists";
import { createUserAction, updateUserAction } from "./actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function statusMessage(status?: string) {
  if (status === "created") {
    return "User created.";
  }

  if (status === "updated") {
    return "User updated.";
  }

  if (status === "error") {
    return "The user change could not be saved. Check required fields and uniqueness.";
  }

  return null;
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const [users, groups, state] = await Promise.all([
    getAdminUsers(),
    getAdminGroups(),
    searchParams
  ]);
  const message = statusMessage(state?.status);

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Users</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">User directory</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review local accounts, roles, group membership, and learner activity counts.
        </p>
      </section>
      {message ? (
        <p className="mt-5 rounded-md border border-border bg-white px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold">Create user</h2>
          <form action={createUserAction} className="mt-4 grid gap-4 lg:grid-cols-2">
          <CsrfField />
            <label className="grid gap-1 text-sm font-medium">
              Name
              <input className="h-10 rounded-md border border-border px-3" name="name" required />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Email
              <input className="h-10 rounded-md border border-border px-3" name="email" required type="email" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Temporary password
              <input className="h-10 rounded-md border border-border px-3" minLength={12} name="password" required type="password" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium">
                Role
                <select className="h-10 rounded-md border border-border px-3" name="role" defaultValue="LEARNER">
                  <option value="LEARNER">Learner</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Status
                <select className="h-10 rounded-md border border-border px-3" name="status" defaultValue="ACTIVE">
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium lg:col-span-2">
              Groups
              <select className="min-h-24 rounded-md border border-border px-3 py-2" multiple name="groupIds">
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="lg:col-span-2">
              <Button type="submit">Create user</Button>
            </div>
          </form>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["User", "Access", "Groups", "Activity", "Created", "Update"]}
            emptyTitle="No users"
            emptyDescription="User records will appear here after accounts are created."
            rows={users.map((adminUser) => [
              <div key="user">
                <p className="font-semibold">
                  {adminUser.name}
                  {adminUser.id === user.id ? " (you)" : ""}
                </p>
                <p className="text-xs text-muted-foreground">{adminUser.email}</p>
              </div>,
              <div className="grid gap-2" key="access">
                <StatusBadge>{formatAdminLabel(adminUser.role)}</StatusBadge>
                <StatusBadge tone={adminUser.status === "ACTIVE" ? "success" : "warning"}>
                  {formatAdminLabel(adminUser.status)}
                </StatusBadge>
              </div>,
              adminUser.groups.length > 0 ? (
                <span key="groups">{adminUser.groups.map((group) => group.name).join(", ")}</span>
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
              <span key="created">{formatDate(adminUser.createdAt)}</span>,
              <form action={updateUserAction} className="grid min-w-[16rem] gap-2" key="update">
          <CsrfField />
                <input name="userId" type="hidden" value={adminUser.id} />
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="name" defaultValue={adminUser.name} required />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select className="h-9 rounded-md border border-border px-2 text-sm" name="role" defaultValue={adminUser.role}>
                    <option value="LEARNER">Learner</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <select className="h-9 rounded-md border border-border px-2 text-sm" name="status" defaultValue={adminUser.status}>
                    <option value="ACTIVE">Active</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
                <select className="min-h-20 rounded-md border border-border px-2 py-1 text-sm" multiple name="groupIds" defaultValue={adminUser.groups.map((group) => group.id)}>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <Button className="h-9" type="submit" variant="secondary">
                  Save
                </Button>
              </form>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Password reset and destructive user deletion are intentionally deferred.
      </p>
    </AppShell>
  );
}
