import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { formatAdminLabel, getAdminChallenges } from "@/lib/core/admin-lists";
import {
  createChallengeAction,
  deleteChallengeAttachmentAction,
  updateChallengeAction,
  uploadChallengeAttachmentAction
} from "./actions";

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

function formatJson(value: unknown) {
  return value ? JSON.stringify(value, null, 2) : "";
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${Math.round((sizeBytes / (1024 * 1024)) * 10) / 10} MB`;
}

function statusMessage(status?: string) {
  if (status === "created") {
    return "Challenge created.";
  }

  if (status === "updated") {
    return "Challenge updated.";
  }

  if (status === "attached") {
    return "Challenge attachment uploaded.";
  }

  if (status === "attachment-deleted") {
    return "Challenge attachment deleted.";
  }

  if (status === "error") {
    return "The challenge change could not be saved. Check required fields, slug uniqueness, JSON config, and attachment limits.";
  }

  return null;
}

export default async function AdminChallengesPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const [challenges, state] = await Promise.all([getAdminChallenges(), searchParams]);
  const message = statusMessage(state?.status);

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Challenges</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Challenge catalog</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review challenge metadata, supported validation types, linked modules, and attempt volume.
        </p>
      </section>
      {message ? (
        <p className="mt-5 rounded-md border border-border bg-white px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold">Create challenge</h2>
          <form action={createChallengeAction} className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Title
              <input className="h-10 rounded-md border border-border px-3" name="title" required />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Slug
              <input className="h-10 rounded-md border border-border px-3" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
            </label>
            <label className="grid gap-1 text-sm font-medium lg:col-span-2">
              Description
              <input className="h-10 rounded-md border border-border px-3" name="description" required />
            </label>
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
              <label className="grid gap-1 text-sm font-medium">
                Type
                <select className="h-10 rounded-md border border-border px-3" name="type" defaultValue="STATIC_FLAG">
                  <option value="STATIC_FLAG">Static flag</option>
                  <option value="MULTIPLE_CHOICE">Multiple choice</option>
                  <option value="SHORT_ANSWER">Short answer</option>
                  <option value="FILE_BASED">File based</option>
                  <option value="DOCKER_WEB">Docker web</option>
                </select>
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
                Points
                <input className="h-10 rounded-md border border-border px-3" defaultValue={0} min={0} name="points" type="number" />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-medium">
              Difficulty
              <input className="h-10 rounded-md border border-border px-3" name="difficulty" required />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Tags
              <input className="h-10 rounded-md border border-border px-3" name="tags" placeholder="appsec, fundamentals" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Validation config JSON
              <textarea className="min-h-40 rounded-md border border-border px-3 py-2 font-mono text-sm" name="validationConfig" />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Runtime config JSON
              <textarea className="min-h-40 rounded-md border border-border px-3 py-2 font-mono text-sm" name="runtimeConfig" />
            </label>
            <div className="lg:col-span-2">
              <Button type="submit">Create challenge</Button>
            </div>
          </form>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Challenge", "Type", "Status", "Points", "Tags", "Usage", "Attachments", "Updated", "Update"]}
            emptyTitle="No challenges"
            emptyDescription="Challenge records will appear here after challenges are created."
            rows={challenges.map((challenge) => [
              <div key="challenge">
                <p className="font-semibold">{challenge.title}</p>
                <p className="text-xs text-muted-foreground">{challenge.slug}</p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">{challenge.description}</p>
              </div>,
              <StatusBadge key="type">{formatAdminLabel(challenge.type)}</StatusBadge>,
              <StatusBadge key="status" tone={statusTone(challenge.status)}>
                {formatAdminLabel(challenge.status)}
              </StatusBadge>,
              <span className="font-semibold" key="points">
                {challenge.points}
              </span>,
              challenge.tags.length > 0 ? (
                <span key="tags">{challenge.tags.join(", ")}</span>
              ) : (
                <span className="text-muted-foreground" key="tags">
                  None
                </span>
              ),
              <div key="usage">
                <p>{challenge.modules} modules</p>
                <p className="text-xs text-muted-foreground">
                  {challenge.attempts} attempts, {challenge.attachmentCount} files
                </p>
              </div>,
              <div className="grid min-w-[16rem] gap-3" key="attachments">
                {challenge.attachments.length > 0 ? (
                  <div className="grid gap-2">
                    {challenge.attachments.map((attachment) => (
                      <div className="rounded-md border border-border bg-slate-50 p-2" key={attachment.id}>
                        <p className="font-semibold">{attachment.originalName}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.mimeType} · {formatBytes(attachment.sizeBytes)}
                        </p>
                        <form action={deleteChallengeAttachmentAction} className="mt-2">
                          <input name="attachmentId" type="hidden" value={attachment.id} />
                          <Button className="h-8 px-2" type="submit" variant="ghost">
                            Delete
                          </Button>
                        </form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">No files</span>
                )}
                <form action={uploadChallengeAttachmentAction} className="grid gap-2" encType="multipart/form-data">
                  <input name="challengeId" type="hidden" value={challenge.id} />
                  <input
                    className="rounded-md border border-border px-2 py-1 text-sm"
                    name="file"
                    required
                    type="file"
                  />
                  <Button className="h-8" type="submit" variant="secondary">
                    Upload
                  </Button>
                </form>
              </div>,
              <span key="updated">{formatDate(challenge.updatedAt)}</span>,
              <form action={updateChallengeAction} className="grid min-w-[22rem] gap-2" key="update">
                <input name="challengeId" type="hidden" value={challenge.id} />
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="title" defaultValue={challenge.title} required />
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="slug" defaultValue={challenge.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="description" defaultValue={challenge.description} required />
                <div className="grid gap-2 sm:grid-cols-3">
                  <select className="h-9 rounded-md border border-border px-2 text-sm" name="type" defaultValue={challenge.type}>
                    <option value="STATIC_FLAG">Static flag</option>
                    <option value="MULTIPLE_CHOICE">Multiple choice</option>
                    <option value="SHORT_ANSWER">Short answer</option>
                    <option value="FILE_BASED">File based</option>
                    <option value="DOCKER_WEB">Docker web</option>
                  </select>
                  <select className="h-9 rounded-md border border-border px-2 text-sm" name="status" defaultValue={challenge.status}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                  <input className="h-9 rounded-md border border-border px-2 text-sm" min={0} name="points" defaultValue={challenge.points} type="number" />
                </div>
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="difficulty" defaultValue={challenge.difficulty} required />
                <input className="h-9 rounded-md border border-border px-2 text-sm" name="tags" defaultValue={challenge.tags.join(", ")} />
                <textarea className="min-h-28 rounded-md border border-border px-2 py-1 font-mono text-xs" name="validationConfig" defaultValue={formatJson(challenge.validationConfig)} />
                <textarea className="min-h-28 rounded-md border border-border px-2 py-1 font-mono text-xs" name="runtimeConfig" defaultValue={formatJson(challenge.runtimeConfig)} />
                <Button className="h-9" type="submit" variant="secondary">
                  Save
                </Button>
              </form>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Validation config is edited as JSON until richer type-specific editors are added.
      </p>
    </AppShell>
  );
}
