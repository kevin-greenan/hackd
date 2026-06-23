import { redirect } from "next/navigation";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { CsrfField } from "@/components/csrf-field";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getBranding } from "@/lib/branding/theme";

const errorMessages: Record<string, string> = {
  invalid: "The email or password is incorrect.",
  rate_limited: "Too many login attempts. Wait a minute and try again.",
  unauthorized: "Sign in before opening that page."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const user = await getCurrentUser();
  const branding = getBranding();

  if (user) {
    redirect("/dashboard");
  }

  const error = searchParams?.error ? errorMessages[searchParams.error] : null;

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
          Welcome back
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
          Sign in to {branding.name}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
          {branding.tagline}
        </p>
      </section>
      <Card>
        <form action="/api/auth/login" method="post" className="grid gap-5">
          <CsrfField />
          <div>
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </Card>
    </main>
  );
}
