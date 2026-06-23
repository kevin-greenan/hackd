import { AdminTable } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { CsrfField } from "@/components/csrf-field";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAdminGroups } from "@/lib/core/admin-lists";
import { createGroupAction, deleteGroupAction, updateGroupAction } from "./actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function statusMessage(status?: string) {
  if (status === "created") {
    return "Group created.";
  }

  if (status === "updated") {
    return "Group updated.";
  }

  if (status === "deleted") {
    return "Group deleted.";
  }

  if (status === "error") {
    return "The group change could not be saved. Check slug uniqueness and delete constraints.";
  }

  return null;
}

export default async function AdminGroupsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const [groups, state] = await Promise.all([getAdminGroups(), searchParams]);
  const message = statusMessage(state?.status);

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Groups</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Group directory</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review learner groups, assignment targets, and membership counts.
        </p>
      </section>
      {message ? (
        <p className="mt-5 rounded-md border border-border bg-white px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold">Create group</h2>
          <form action={createGroupAction} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <CsrfField />
            <label className="grid gap-1 text-sm font-medium">
              Name
              <input className="h-10 rounded-md border border-border px-3" name="name" required />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Slug
              <input className="h-10 rounded-md border border-border px-3" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
            </label>
            <label className="grid gap-1 text-sm font-medium lg:col-span-2">
              Description
              <input className="h-10 rounded-md border border-border px-3" name="description" />
            </label>
            <div className="flex items-end">
              <Button type="submit">Create group</Button>
            </div>
          </form>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Group", "Description", "Members", "Assignments", "Created", "Update"]}
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
              <span key="created">{formatDate(group.createdAt)}</span>,
              <div className="grid min-w-[16rem] gap-2" key="update">
                <form action={updateGroupAction} className="grid gap-2">
          <CsrfField />
                  <input name="groupId" type="hidden" value={group.id} />
                  <input className="h-9 rounded-md border border-border px-2 text-sm" name="name" defaultValue={group.name} required />
                  <input className="h-9 rounded-md border border-border px-2 text-sm" name="slug" defaultValue={group.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
                  <input className="h-9 rounded-md border border-border px-2 text-sm" name="description" defaultValue={group.description ?? ""} />
                  <Button className="h-9" type="submit" variant="secondary">
                    Save
                  </Button>
                </form>
                <form action={deleteGroupAction}>
          <CsrfField />
                  <input name="groupId" type="hidden" value={group.id} />
                  <Button
                    className="h-9 w-full"
                    disabled={group.members > 0 || group.assignments > 0}
                    type="submit"
                    variant="ghost"
                  >
                    Delete
                  </Button>
                </form>
              </div>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Groups can be deleted only when they have no members and no assignments.
      </p>
    </AppShell>
  );
}
