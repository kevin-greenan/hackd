import { InstanceStatus } from "@prisma/client";
import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { formatAdminLabel } from "@/lib/core/admin-lists";
import { getAdminChallengeInstances } from "@/lib/core/challenge-runtime";
import {
  cleanupExpiredInstancesAction,
  stopAdminChallengeInstanceAction
} from "./actions";

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function statusTone(status: InstanceStatus): "neutral" | "success" | "warning" {
  if (status === InstanceStatus.RUNNING) {
    return "success";
  }

  if (status === InstanceStatus.FAILED || status === InstanceStatus.STARTING) {
    return "warning";
  }

  return "neutral";
}

function statusMessage(status?: string) {
  if (status === "stopped") {
    return "Challenge instance stopped.";
  }

  if (status === "cleaned") {
    return "Expired challenge instances cleaned up.";
  }

  if (status === "error") {
    return "The runtime action could not be completed.";
  }

  return null;
}

export default async function AdminInstancesPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const [instances, state] = await Promise.all([getAdminChallengeInstances(), searchParams]);
  const message = statusMessage(state?.status);

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Runtime</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Challenge instances</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review Dockerized challenge lifecycle state and stop running or expired instances.
        </p>
      </section>
      {message ? (
        <p className="mt-5 rounded-md border border-border bg-white px-4 py-3 text-sm font-semibold">
          {message}
        </p>
      ) : null}
      <section className="mt-8">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Instances</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Expired running instances are cleaned before this list renders.
              </p>
            </div>
            <form action={cleanupExpiredInstancesAction}>
              <Button type="submit" variant="secondary">
                Cleanup expired
              </Button>
            </form>
          </div>
          <div className="mt-4">
            <AdminTable
              columns={["Challenge", "Learner", "Status", "URL", "Lifecycle", "Runner log", "Action"]}
              emptyTitle="No challenge instances"
              emptyDescription="Dockerized challenge instances will appear here after learners launch them."
              rows={instances.map((instance) => [
                <div key="challenge">
                  <p className="font-semibold">{instance.challenge.title}</p>
                  <p className="text-xs text-muted-foreground">{instance.challenge.slug}</p>
                </div>,
                <div key="learner">
                  <p className="font-semibold">{instance.user.name}</p>
                  <p className="text-xs text-muted-foreground">{instance.user.email}</p>
                </div>,
                <StatusBadge key="status" tone={statusTone(instance.status)}>
                  {formatAdminLabel(instance.status)}
                </StatusBadge>,
                instance.url ? (
                  <a className="font-semibold text-teal-700 hover:text-teal-900" href={instance.url} key="url">
                    {instance.url}
                  </a>
                ) : (
                  <span className="text-muted-foreground" key="url">
                    Not available
                  </span>
                ),
                <div key="lifecycle">
                  <p>Started: {formatDateTime(instance.startedAt)}</p>
                  <p>Expires: {formatDateTime(instance.expiresAt)}</p>
                  <p>Stopped: {formatDateTime(instance.stoppedAt)}</p>
                </div>,
                <code className="block max-w-sm whitespace-pre-wrap break-words rounded-md bg-slate-50 px-2 py-1 text-xs" key="log">
                  {instance.statusMessage || instance.runnerLog || "No runner log"}
                </code>,
                instance.status === InstanceStatus.RUNNING || instance.status === InstanceStatus.STARTING ? (
                  <form action={stopAdminChallengeInstanceAction} key="action">
                    <input name="instanceId" type="hidden" value={instance.id} />
                    <Button className="h-9" type="submit" variant="ghost">
                      Stop
                    </Button>
                  </form>
                ) : (
                  <span className="text-muted-foreground" key="action">
                    None
                  </span>
                )
              ])}
            />
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
