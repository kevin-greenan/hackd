import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card, EmptyState } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAdminMetrics, getRecentAdminAttempts } from "@/lib/core/admin-metrics";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

export default async function AdminPage() {
  const user = await requireAdmin();
  const [metrics, recentAttempts] = await Promise.all([
    getAdminMetrics(),
    getRecentAdminAttempts()
  ]);
  const adminCards: {
    title: string;
    href?: string;
    count: number;
    description: string;
  }[] = [
    {
      title: "Users",
      href: "/admin/users",
      count: metrics.users,
      description: "Seeded admin and learner accounts are available for local testing."
    },
    {
      title: "Groups",
      href: "/admin/groups",
      count: metrics.groups,
      description: "Groups can target assignments and are seeded for sample learner data."
    },
    {
      title: "Modules",
      href: "/admin/modules",
      count: metrics.modules,
      description: "Module records now back the learner dashboard assignment list."
    },
    {
      title: "Challenges",
      href: "/admin/challenges",
      count: metrics.challenges,
      description: "Static, short-answer, and multiple-choice validation paths are available."
    },
    {
      title: "Assignments",
      href: "/admin/assignments",
      count: metrics.assignments,
      description: "Assignments can target exactly one user or group."
    },
    {
      title: "Reports",
      href: "/admin/reports",
      count: metrics.attempts,
      description: "Attempt and completion records are available for reporting foundations."
    },
    {
      title: "Audit",
      href: "/admin/audit",
      count: metrics.auditLogs,
      description: "Admin management changes are recorded for review."
    }
  ];

  return (
    <AppShell user={user} area="admin">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Admin</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Control plane foundation</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          This admin-only area is server-protected and ready for the management workflows in later milestones.
        </p>
      </section>
      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map((card) => (
          <Card key={card.title}>
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-3xl font-bold">{card.count}</p>
            <EmptyState title="Foundation ready" description={card.description} />
            {card.href ? (
              <ButtonLink className="mt-4 w-full" href={card.href} variant="secondary">
                View {card.title.toLowerCase()}
              </ButtonLink>
            ) : null}
          </Card>
        ))}
      </section>
      <section className="mt-8">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent attempts</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest learner submissions across supported challenge types.
              </p>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {recentAttempts.length} shown
            </p>
          </div>
          {recentAttempts.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="py-3 pr-4 font-semibold">Learner</th>
                    <th className="py-3 pr-4 font-semibold">Challenge</th>
                    <th className="py-3 pr-4 font-semibold">Result</th>
                    <th className="py-3 pr-4 font-semibold">Score</th>
                    <th className="py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((attempt) => (
                    <tr className="border-b border-border last:border-0" key={attempt.id}>
                      <td className="py-3 pr-4 align-top">
                        <p className="font-semibold">{attempt.learnerName}</p>
                        <p className="text-xs text-muted-foreground">{attempt.learnerEmail}</p>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <p className="font-semibold">{attempt.challengeTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatLabel(attempt.challengeType)}
                        </p>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            attempt.result === "CORRECT"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {formatLabel(attempt.result)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 align-top font-semibold">
                        {attempt.scoreAwarded} / {attempt.points}
                      </td>
                      <td className="py-3 align-top text-muted-foreground">
                        {formatDateTime(attempt.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No attempts yet"
              description="Learner submissions will appear here after challenges are attempted."
            />
          )}
        </Card>
      </section>
    </AppShell>
  );
}
