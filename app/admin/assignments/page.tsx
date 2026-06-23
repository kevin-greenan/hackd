import Link from "next/link";
import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import {
  formatAdminLabel,
  getAdminAssignments,
  getAdminGroupOptions,
  getAdminModuleOptions,
  getAdminUserOptions
} from "@/lib/core/admin-lists";
import {
  createAssignmentAction,
  deleteAssignmentAction,
  updateAssignmentAction
} from "./actions";

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

function formatDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function statusMessage(status?: string) {
  if (status === "created") {
    return "Assignment created.";
  }

  if (status === "updated") {
    return "Assignment updated.";
  }

  if (status === "deleted") {
    return "Assignment deleted.";
  }

  if (status === "error") {
    return "The assignment change could not be saved. Check the module, target, and duplicate assignments.";
  }

  return null;
}

export default async function AdminAssignmentsPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const [assignments, modules, users, groups, state] = await Promise.all([
    getAdminAssignments(),
    getAdminModuleOptions(),
    getAdminUserOptions(),
    getAdminGroupOptions(),
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
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Assignments</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Assignment queue</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Create, update, and remove module assignments for learner and group targets.
        </p>
      </section>
      {message ? (
        <p className="mt-5 rounded-md border border-border bg-white px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold">Create assignment</h2>
          <form action={createAssignmentAction} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_10rem_8rem_auto]">
            <label className="grid gap-1 text-sm font-medium">
              Module
              <select className="h-10 rounded-md border border-border px-3" name="moduleId" required>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Target
              <select className="h-10 rounded-md border border-border px-3" name="target" required>
                <optgroup label="Learners and admins">
                  {users.map((targetUser) => (
                    <option key={targetUser.id} value={`user:${targetUser.id}`}>
                      {targetUser.name} ({targetUser.email})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Groups">
                  {groups.map((group) => (
                    <option key={group.id} value={`group:${group.id}`}>
                      {group.name} ({group.slug})
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Due date
              <input className="h-10 rounded-md border border-border px-3" name="dueAt" type="date" />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium">
              <input className="h-4 w-4 accent-teal-700" defaultChecked name="required" type="checkbox" />
              Required
            </label>
            <div className="flex items-end">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Module", "Target", "Required", "Due", "Assigned by", "Created", "Update", "Delete"]}
            emptyTitle="No assignments"
            emptyDescription="Assignment records will appear here after modules are assigned."
            rows={assignments.map((assignment) => [
              <div key="module">
                <Link
                  className="font-semibold text-primary hover:opacity-80"
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
              <span key="created">{formatDate(assignment.createdAt)}</span>,
              <form action={updateAssignmentAction} className="grid min-w-[18rem] gap-2" key="update">
                <input name="assignmentId" type="hidden" value={assignment.id} />
                <select className="h-9 rounded-md border border-border px-2 text-sm" name="moduleId" defaultValue={assignment.moduleId}>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border border-border px-2 text-sm"
                  name="target"
                  defaultValue={
                    assignment.userId ? `user:${assignment.userId}` : `group:${assignment.groupId}`
                  }
                >
                  <optgroup label="Learners and admins">
                    {users.map((targetUser) => (
                      <option key={targetUser.id} value={`user:${targetUser.id}`}>
                        {targetUser.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Groups">
                    {groups.map((group) => (
                      <option key={group.id} value={`group:${group.id}`}>
                        {group.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    className="h-9 rounded-md border border-border px-2 text-sm"
                    name="dueAt"
                    type="date"
                    defaultValue={formatDateInput(assignment.dueAt)}
                  />
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      className="h-4 w-4 accent-teal-700"
                      defaultChecked={assignment.required}
                      name="required"
                      type="checkbox"
                    />
                    Required
                  </label>
                </div>
                <Button className="h-9" type="submit" variant="secondary">
                  Save
                </Button>
              </form>,
              <form action={deleteAssignmentAction} key="delete">
                <input name="assignmentId" type="hidden" value={assignment.id} />
                <Button className="h-9" type="submit" variant="ghost">
                  Delete
                </Button>
              </form>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Assignment changes are audit logged and reflected on learner dashboards.
      </p>
    </AppShell>
  );
}
