import { AppShell } from "@/components/app-shell";
import { Card, EmptyState } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";

const adminCards = [
  ["Users", "Seeded admin account is available; user management UI is planned for Milestone 5."],
  ["Modules", "Module records exist in the schema; authoring is deferred."],
  ["Challenges", "Challenge metadata is modeled; runtime support is intentionally out of scope."],
  ["Assignments", "User and group assignment relations are ready for future workflows."],
  ["Reports", "Attempts and completions have schema support for reporting foundations."]
];

export default async function AdminPage() {
  const user = await requireAdmin();

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
        {adminCards.map(([title, description]) => (
          <Card key={title}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <EmptyState title="Placeholder" description={description} />
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
