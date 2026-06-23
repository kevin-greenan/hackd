import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8">
      <nav className="flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">hackd</span>
        <ButtonLink href="/login" variant="secondary">
          Login
        </ButtonLink>
      </nav>
      <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            Security training runtime
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            hackd
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-700">
            Containerized control plane for hands-on security training.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/login">Sign in</ButtonLink>
            <ButtonLink href="/api/healthz" variant="ghost">
              Health check
            </ButtonLink>
          </div>
        </div>
        <Card>
          <div className="grid gap-4">
            {[
              ["Modules", "Narrative lessons and guided security objectives."],
              ["Challenges", "Validated exercises ready for static and future sandbox flows."],
              ["Progress", "Learner state, attempts, completions, and reporting foundations."]
            ].map(([title, body]) => (
              <div key={title} className="rounded-md border border-border bg-slate-50 p-4">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
