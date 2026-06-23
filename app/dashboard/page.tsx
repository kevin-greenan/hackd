import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card, EmptyState } from "@/components/card";
import { requireUser } from "@/lib/auth/current-user";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const user = await requireUser();

  return (
    <AppShell user={user} area="learner">
      {searchParams?.error === "unauthorized" ? (
        <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your account does not have access to the admin area.
        </p>
      ) : null}
      <section className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Dashboard</p>
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
          <p className="mt-2 text-3xl font-bold">0</p>
          <EmptyState
            title="No assignments yet"
            description="Module assignment workflows arrive in the next milestones."
          />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Progress</h2>
          <p className="mt-2 text-3xl font-bold">0%</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Completion tracking is modeled in Prisma and will be wired with module rendering.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <EmptyState
            title="No activity recorded"
            description="Attempts and completions will appear here once challenges are enabled."
          />
        </Card>
      </section>
    </AppShell>
  );
}
