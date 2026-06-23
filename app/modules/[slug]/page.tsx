import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card, EmptyState } from "@/components/card";
import { MarkdownContent } from "@/components/learning/markdown-content";
import { requireUser } from "@/lib/auth/current-user";
import { getLearnerModuleDetail } from "@/lib/core/module-detail";

function formatDate(date: Date | null) {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

export default async function ModuleDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const learningModule = await getLearnerModuleDetail({ userId: user.id, role: user.role, slug });

  if (!learningModule) {
    notFound();
  }

  const completeChallengeCount = learningModule.challenges.filter(
    (challenge) => challenge.isComplete
  ).length;

  return (
    <AppShell user={user} area="learner">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
      <section className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            Module
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">{learningModule.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            {learningModule.summary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {learningModule.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Card>
          <h2 className="text-lg font-semibold">Status</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Progress</dt>
              <dd className="font-semibold">{formatLabel(learningModule.completionStatus)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Difficulty</dt>
              <dd className="font-semibold">{learningModule.difficulty}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Estimated time</dt>
              <dd className="font-semibold">
                {learningModule.estimatedMinutes
                  ? `${learningModule.estimatedMinutes} minutes`
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Due</dt>
              <dd className="font-semibold">{formatDate(learningModule.assignment.dueAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Challenges</dt>
              <dd className="font-semibold">
                {completeChallengeCount} of {learningModule.challenges.length} complete
              </dd>
            </div>
          </dl>
        </Card>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <MarkdownContent markdown={learningModule.bodyMarkdown} />
        </Card>
        <aside className="grid content-start gap-5">
          <Card>
            <h2 className="text-lg font-semibold">Challenges</h2>
            {learningModule.challenges.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {learningModule.challenges.map((challenge) => (
                  <div key={challenge.id} className="rounded-md border border-border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          challenge.isComplete
                            ? "bg-teal-100 text-teal-800"
                            : "bg-white text-slate-700"
                        }`}
                      >
                        {challenge.isComplete ? "complete" : "not complete"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {challenge.description}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {formatLabel(challenge.type)} · {challenge.points} points ·{" "}
                      {challenge.required ? "required" : "optional"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No challenges"
                description="Challenge sections will appear here when this module has linked challenges."
              />
            )}
          </Card>
          <ButtonLink href="/dashboard" variant="secondary">
            Return to dashboard
          </ButtonLink>
        </aside>
      </section>
    </AppShell>
  );
}
