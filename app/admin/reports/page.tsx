import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card, EmptyState } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { formatAdminLabel } from "@/lib/core/admin-lists";
import { getAdminProgressReports } from "@/lib/core/admin-reports";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function percentTone(percent: number): "neutral" | "success" | "warning" {
  if (percent >= 80) {
    return "success";
  }

  if (percent > 0) {
    return "warning";
  }

  return "neutral";
}

export default async function AdminReportsPage() {
  const user = await requireAdmin();
  const reports = await getAdminProgressReports();

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Reports</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Progress reporting</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review learner progress, module completion, challenge performance, and export raw completion or attempt data.
        </p>
      </section>
      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Learners</h2>
          <p className="mt-3 text-3xl font-bold">{reports.totals.learners}</p>
          <EmptyState title="Tracked users" description="Learner-role users included in progress calculations." />
        </Card>
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Assigned modules</h2>
          <p className="mt-3 text-3xl font-bold">{reports.totals.assignedModules}</p>
          <EmptyState title="Expanded targets" description="Direct and group assignments counted per learner." />
        </Card>
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Completed</h2>
          <p className="mt-3 text-3xl font-bold">{reports.totals.completedModules}</p>
          <EmptyState title="Completion records" description="Completed learner-module records across assignments." />
        </Card>
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Completion rate</h2>
          <p className="mt-3 text-3xl font-bold">{reports.totals.completionPercent}%</p>
          <EmptyState title="Overall progress" description="Completed modules divided by assigned learner modules." />
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Learner progress</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Completion status across direct and group-targeted assignments.
              </p>
            </div>
            <ButtonLink href="/admin/reports/completions.csv" variant="secondary">
              Export completions CSV
            </ButtonLink>
          </div>
          <div className="mt-4">
            <AdminTable
              columns={["Learner", "Assigned", "Completed", "In progress", "Not started", "Rate"]}
              emptyTitle="No learner progress"
              emptyDescription="Progress appears after learner assignments are created."
              rows={reports.learnerProgress.map((learner) => [
                <div key="learner">
                  <p className="font-semibold">{learner.name}</p>
                  <p className="text-xs text-muted-foreground">{learner.email}</p>
                </div>,
                <span className="font-semibold" key="assigned">
                  {learner.assignedModules}
                </span>,
                <span key="completed">{learner.completed}</span>,
                <span key="in-progress">{learner.inProgress}</span>,
                <span key="not-started">{learner.notStarted}</span>,
                <StatusBadge key="rate" tone={percentTone(learner.percent)}>
                  {learner.percent}%
                </StatusBadge>
              ])}
            />
          </div>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold">Module progress</h2>
          <div className="mt-4">
            <AdminTable
              columns={["Module", "Status", "Assignments", "Challenges", "Completed", "Rate"]}
              emptyTitle="No module progress"
              emptyDescription="Module progress appears after modules and assignments are created."
              rows={reports.moduleProgress.map((module) => [
                <div key="module">
                  <p className="font-semibold">{module.title}</p>
                  <p className="text-xs text-muted-foreground">{module.slug}</p>
                </div>,
                <StatusBadge key="status">{formatAdminLabel(module.status)}</StatusBadge>,
                <span key="assigned">{module.assignedTargets}</span>,
                <span key="challenges">{module.challenges}</span>,
                <span key="completed">{module.completed}</span>,
                <StatusBadge key="rate" tone={percentTone(module.percent)}>
                  {module.percent}%
                </StatusBadge>
              ])}
            />
          </div>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Challenge performance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Attempt outcomes grouped by challenge.
              </p>
            </div>
            <ButtonLink href="/admin/reports/attempts.csv" variant="secondary">
              Export attempts CSV
            </ButtonLink>
          </div>
          <div className="mt-4">
            <AdminTable
              columns={["Challenge", "Type", "Attempts", "Correct", "Incorrect", "Pending", "Avg score"]}
              emptyTitle="No challenge attempts"
              emptyDescription="Challenge performance appears after learner submissions."
              rows={reports.challengePerformance.map((challenge) => [
                <div key="challenge">
                  <p className="font-semibold">{challenge.title}</p>
                  <p className="text-xs text-muted-foreground">{challenge.slug}</p>
                </div>,
                <StatusBadge key="type">{formatAdminLabel(challenge.type)}</StatusBadge>,
                <span key="attempts">{challenge.total}</span>,
                <span key="correct">{challenge.correct}</span>,
                <span key="incorrect">{challenge.incorrect}</span>,
                <span key="pending">{challenge.pending}</span>,
                <span key="average">
                  {challenge.averageScore} / {challenge.points}
                </span>
              ])}
            />
          </div>
        </Card>
      </section>
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold">Recent attempts</h2>
          <div className="mt-4">
            <AdminTable
              columns={["Learner", "Challenge", "Result", "Score", "Submitted"]}
              emptyTitle="No recent attempts"
              emptyDescription="Recent attempts appear after learners submit challenge answers."
              rows={reports.recentAttempts.map((attempt) => [
                <div key="learner">
                  <p className="font-semibold">{attempt.learnerName}</p>
                  <p className="text-xs text-muted-foreground">{attempt.learnerEmail}</p>
                </div>,
                <div key="challenge">
                  <p className="font-semibold">{attempt.challengeTitle}</p>
                  <p className="text-xs text-muted-foreground">{formatAdminLabel(attempt.challengeType)}</p>
                </div>,
                <StatusBadge key="result" tone={attempt.result === "CORRECT" ? "success" : "warning"}>
                  {formatAdminLabel(attempt.result)}
                </StatusBadge>,
                <span key="score">
                  {attempt.scoreAwarded} / {attempt.points}
                </span>,
                <span key="submitted">{formatDateTime(attempt.createdAt)}</span>
              ])}
            />
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
