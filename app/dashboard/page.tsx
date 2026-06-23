import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card, EmptyState } from "@/components/card";
import { requireUser } from "@/lib/auth/current-user";
import { getLearnerDashboard } from "@/lib/core/learner-dashboard";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const user = await requireUser();
  const dashboard = await getLearnerDashboard(user.id);

  return (
    <AppShell user={user} area="learner">
      {searchParams?.error === "unauthorized" ? (
        <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your account does not have access to the admin area.
        </p>
      ) : null}
      <section className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Dashboard</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Good to see you, {user.name}</h1>
          <p className="mt-2 text-muted-foreground">
            Signed in as {user.email} with role {user.role.toLowerCase()}.
          </p>
        </div>
        {user.role === "ADMIN" ? <ButtonLink href="/admin">Open admin</ButtonLink> : null}
      </section>
      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Assigned modules</h2>
          <p className="mt-2 text-3xl font-bold">{dashboard.assignedModules.length}</p>
          {dashboard.assignedModules.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {dashboard.assignedModules.slice(0, 3).map((assignment) => (
                <div key={assignment.id} className="rounded-md border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{assignment.module.title}</h3>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-primary">
                      {assignment.completionStatus.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {assignment.module.summary}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {assignment.module.difficulty} · {assignment.module.challengeCount} challenge
                    {assignment.module.challengeCount === 1 ? "" : "s"} · {assignment.targetType}
                  </p>
                  <div className="mt-3">
                    <ButtonLink href={`/modules/${assignment.module.slug}`} variant="secondary">
                      Open module
                    </ButtonLink>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No assignments yet"
              description="Assignments will appear here once an admin assigns modules to you or your groups."
            />
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Progress</h2>
          <p className="mt-2 text-3xl font-bold">{dashboard.summary.percent}%</p>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <p>Completed: {dashboard.summary.completed}</p>
            <p>In progress: {dashboard.summary.inProgress}</p>
            <p>Not started: {dashboard.summary.notStarted}</p>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Recent activity</h2>
          {dashboard.recentAttempts.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {dashboard.recentAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-md border border-border bg-surface p-3">
                  <p className="text-sm font-semibold">{attempt.challengeTitle}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {attempt.result.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No activity recorded"
              description="Challenge attempts and completions will appear here as learners work."
            />
          )}
        </Card>
      </section>
    </AppShell>
  );
}
