import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/button";
import { Card, EmptyState } from "@/components/card";
import { MarkdownContent } from "@/components/learning/markdown-content";
import { requireUser } from "@/lib/auth/current-user";
import { getLearnerModuleDetail, type LearnerModuleChallenge } from "@/lib/core/module-detail";
import {
  launchChallengeInstanceAction,
  stopChallengeInstanceAction,
  submitChallengeAction
} from "./actions";

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

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${Math.round((sizeBytes / (1024 * 1024)) * 10) / 10} MB`;
}

function formatRuntimeStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function RuntimeControls({
  challenge,
  moduleSlug
}: {
  challenge: LearnerModuleChallenge;
  moduleSlug: string;
}) {
  if (challenge.type !== "DOCKER_WEB") {
    return null;
  }

  const instance = challenge.activeInstance;
  const isRunning = instance?.status === "RUNNING" && instance.url;
  const isStarting = instance?.status === "STARTING";

  return (
    <div className="mt-4 rounded-md border border-border bg-white p-3">
      <h4 className="text-sm font-semibold">Runtime</h4>
      {instance ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Status: {formatRuntimeStatus(instance.status)}
          {instance.expiresAt ? ` · expires ${formatDate(instance.expiresAt)}` : ""}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Launch a temporary Dockerized challenge environment.
        </p>
      )}
      {instance?.statusMessage ? (
        <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
          {instance.statusMessage}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {isRunning ? (
          <ButtonLink href={instance.url as string} variant="secondary">
            Open challenge
          </ButtonLink>
        ) : null}
        {isRunning || isStarting ? (
          <form action={stopChallengeInstanceAction}>
            <input name="moduleSlug" type="hidden" value={moduleSlug} />
            <input name="challengeId" type="hidden" value={challenge.id} />
            <input name="instanceId" type="hidden" value={instance.id} />
            <Button type="submit" variant="ghost">
              Stop
            </Button>
          </form>
        ) : (
          <form action={launchChallengeInstanceAction}>
            <input name="moduleSlug" type="hidden" value={moduleSlug} />
            <input name="challengeId" type="hidden" value={challenge.id} />
            <Button type="submit">Launch</Button>
          </form>
        )}
      </div>
    </div>
  );
}

function ChallengeSubmissionForm({
  challenge,
  moduleSlug
}: {
  challenge: LearnerModuleChallenge;
  moduleSlug: string;
}) {
  if (!challenge.submissionConfig) {
    return null;
  }

  const submissionConfig = challenge.submissionConfig;

  return (
    <form action={submitChallengeAction} className="mt-4 grid gap-3">
      <input name="moduleSlug" type="hidden" value={moduleSlug} />
      <input name="challengeId" type="hidden" value={challenge.id} />
      {submissionConfig.type === "text" ? (
        <>
          <label className="text-sm font-medium" htmlFor={`answer-${challenge.id}`}>
            Answer
          </label>
          <input
            className="h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            id={`answer-${challenge.id}`}
            name="submittedValue"
            required
            type="text"
          />
        </>
      ) : (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">
            {submissionConfig.allowMultiple ? "Select all that apply" : "Select one answer"}
          </legend>
          {submissionConfig.options.map((option) => (
            <label
              className="flex items-start gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm"
              key={option.id}
            >
              <input
                className="mt-1 h-4 w-4 accent-teal-700"
                name="submittedValue"
                required={!submissionConfig.allowMultiple}
                type={submissionConfig.allowMultiple ? "checkbox" : "radio"}
                value={option.id}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      )}
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-teal-700"
        type="submit"
      >
        Submit answer
      </button>
    </form>
  );
}

export default async function ModuleDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ challenge?: string; runtime?: string; submission?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const submissionState = await searchParams;
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
                    {challenge.latestAttempt ? (
                      <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-muted-foreground">
                        Latest attempt: {formatLabel(challenge.latestAttempt.result)}
                        {challenge.latestAttempt.feedback ? ` · ${challenge.latestAttempt.feedback}` : ""}
                      </p>
                    ) : null}
                    {challenge.attachments.length > 0 ? (
                      <div className="mt-3 rounded-md border border-border bg-white p-3">
                        <h4 className="text-sm font-semibold">Files</h4>
                        <div className="mt-2 grid gap-2">
                          {challenge.attachments.map((attachment) => (
                            <a
                              className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                              href={`/api/challenge-attachments/${attachment.id}/download`}
                              key={attachment.id}
                            >
                              {attachment.originalName}
                              <span className="ml-2 font-normal text-muted-foreground">
                                {formatBytes(attachment.sizeBytes)}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {submissionState?.challenge === challenge.id && submissionState.submission ? (
                      <p
                        className={`mt-3 rounded-md px-3 py-2 text-sm ${
                          submissionState.submission === "correct"
                            ? "border border-teal-200 bg-teal-50 text-teal-800"
                            : "border border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {submissionState.submission === "correct"
                          ? "Correct. Progress has been updated."
                          : submissionState.submission === "incorrect"
                            ? "That answer is not correct."
                            : "The submission could not be processed."}
                      </p>
                    ) : null}
                    {submissionState?.challenge === challenge.id && submissionState.runtime ? (
                      <p
                        className={`mt-3 rounded-md px-3 py-2 text-sm ${
                          submissionState.runtime === "running"
                            ? "border border-teal-200 bg-teal-50 text-teal-800"
                            : submissionState.runtime === "stopped"
                              ? "border border-slate-200 bg-white text-slate-700"
                              : "border border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        {submissionState.runtime === "running"
                          ? "Challenge instance is running."
                          : submissionState.runtime === "stopped"
                            ? "Challenge instance stopped."
                            : "The challenge instance could not be updated."}
                      </p>
                    ) : null}
                    {learningModule.assignment.targetType !== "preview" ? (
                      <RuntimeControls challenge={challenge} moduleSlug={learningModule.slug} />
                    ) : null}
                    {challenge.supportsSubmission &&
                    !challenge.isComplete &&
                    learningModule.assignment.targetType !== "preview" ? (
                      <ChallengeSubmissionForm challenge={challenge} moduleSlug={learningModule.slug} />
                    ) : null}
                    {!challenge.supportsSubmission && challenge.type !== "DOCKER_WEB" ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Submissions for this challenge type are not enabled yet.
                      </p>
                    ) : null}
                    {learningModule.assignment.targetType === "preview" && challenge.supportsSubmission ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Admin preview mode does not record learner attempts.
                      </p>
                    ) : null}
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
