import { AppShell } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAdminMetrics } from "@/lib/core/admin-metrics";

export default async function AdminPage() {
  const user = await requireAdmin();
  const metrics = await getAdminMetrics();
  const adminCards = [
    {
      title: "Users",
      count: metrics.users,
      description: "Seeded admin and learner accounts are available for local testing."
    },
    {
      title: "Groups",
      count: metrics.groups,
      description: "Groups can target assignments and are seeded for sample learner data."
    },
    {
      title: "Modules",
      count: metrics.modules,
      description: "Module records now back the learner dashboard assignment list."
    },
    {
      title: "Challenges",
      count: metrics.challenges,
      description: "Challenge metadata is modeled; validation arrives in a later milestone."
    },
    {
      title: "Assignments",
      count: metrics.assignments,
      description: "Assignments can target exactly one user or group."
    },
    {
      title: "Reports",
      count: metrics.attempts,
      description: "Attempt and completion records are available for reporting foundations."
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
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
