import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { formatAdminLabel, getAdminChallenges } from "@/lib/core/admin-lists";

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

export default async function AdminChallengesPage() {
  const user = await requireAdmin();
  const challenges = await getAdminChallenges();

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
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Challenge", "Type", "Status", "Points", "Tags", "Usage", "Updated"]}
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
                  {challenge.attempts} attempts, {challenge.runningInstances} instances
                </p>
              </div>,
              <span key="updated">{formatDate(challenge.updatedAt)}</span>
            ])}
          />
        </Card>
      </section>
      <p className="mt-4 text-sm text-muted-foreground">
        Challenge create/edit forms and module association controls are planned for the next Milestone 5 slice.
      </p>
    </AppShell>
  );
}
