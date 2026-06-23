import Link from "next/link";
import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import {
  formatAdminLabel,
  getAdminChallengeOptions,
  getAdminModules
} from "@/lib/core/admin-lists";
import { createModuleAction, linkChallengeAction, updateModuleAction } from "./actions";

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

function statusMessage(status?: string) {
  if (status === "created") {
    return "Module created.";
  }

  if (status === "updated") {
    return "Module updated.";
  }

  if (status === "linked") {
    return "Challenge association saved.";
  }

  if (status === "error") {
    return "The module change could not be saved. Check required fields, slug uniqueness, and JSON values.";
  }

  return null;
}

export default async function AdminModulesPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const [modules, challengeOptions, state] = await Promise.all([
    getAdminModules(),
    getAdminChallengeOptions(),
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
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Modules</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Module catalog</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review module metadata, publication state, challenge links, and assignment coverage.
        </p>
      </section>
      {message ? (
        <p className="mt-5 rounded-md border border-border bg-white px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold">Create module</h2>
          <form action={createModuleAction} className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Title
              <input className="h-10 rounded-md border border-border px-3" name="title" required />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Slug
              <input className="h-10 rounded-md border border-border px-3" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
            </label>
            <label className="grid gap-1 text-sm font-medium lg:col-span-2">
              Summary
              <input className="h-10 rounded-md border border-border px-3" name="summary" required />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Difficulty
              <input className="h-10 rounded-md border border-border px-3" name="difficulty" required />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Estimated minutes
              <input className="h-10 rounded-md border border-border px-3" min={0} name="estimatedMinutes" type="number" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Status
              <select className="h-10 rounded-md border border-border px-3" name="status" defaultValue="DRAFT">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Tags
              <input className="h-10 rounded-md border border-border px-3" name="tags" placeholder="appsec, code-review" />
            </label>
            <label className="grid gap-1 text-sm font-medium lg:col-span-2">
              Markdown body
              <textarea className="min-h-48 rounded-md border border-border px-3 py-2 font-mono text-sm" name="bodyMarkdown" required />
            </label>
            <div className="lg:col-span-2">
              <Button type="submit">Create module</Button>
            </div>
          </form>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold">Associate challenge</h2>
          <form action={linkChallengeAction} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_8rem_8rem_auto]">
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
              Challenge
              <select className="h-10 rounded-md border border-border px-3" name="challengeId" required>
                {challengeOptions.map((challenge) => (
                  <option key={challenge.id} value={challenge.id}>
                    {challenge.title} ({formatAdminLabel(challenge.type)})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Sort
              <input className="h-10 rounded-md border border-border px-3" defaultValue={1} min={0} name="sortOrder" type="number" />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium">
              <input className="h-4 w-4 accent-teal-700" defaultChecked name="required" type="checkbox" />
              Required
            </label>
            <div className="flex items-end">
              <Button type="submit">Link</Button>
            </div>
          </form>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Module", "Status", "Difficulty", "Tags", "Coverage", "Updated", "Update"]}
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
              <span key="updated">{formatDate(module.updatedAt)}</span>,
              <form action={updateModuleAction} className="grid min-w-[20rem] gap-2" key="update">
                <input name="moduleId" type="hidden" value={module.id} />
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="title" defaultValue={module.title} required />
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="slug" defaultValue={module.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="summary" defaultValue={module.summary} required />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className="h-9 rounded-md border border-border px-2 text-sm" name="difficulty" defaultValue={module.difficulty} required />
                  <input className="h-9 rounded-md border border-border px-2 text-sm" min={0} name="estimatedMinutes" defaultValue={module.estimatedMinutes ?? ""} type="number" />
                  <select className="h-9 rounded-md border border-border px-2 text-sm" name="status" defaultValue={module.status}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="tags" defaultValue={module.tags.join(", ")} />
                <textarea className="min-h-32 rounded-md border border-border px-2 py-1 font-mono text-xs" name="bodyMarkdown" defaultValue={module.bodyMarkdown} required />
                <Button className="h-9" type="submit" variant="secondary">
                  Save
                </Button>
              </form>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Use Assignments to target modules to learners or groups.
      </p>
    </AppShell>
  );
}
