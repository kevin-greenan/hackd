"use client";

import Link from "next/link";
import { Button } from "@/components/button";
import { Card } from "@/components/card";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(
    JSON.stringify({
      level: "error",
      event: "ui.route_error",
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString()
    })
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-12">
      <Card className="w-full">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Application error</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">
          The request could not be completed. Retry the view, or return to the dashboard if the problem continues.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => reset()}>Retry</Button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-surface"
            href="/dashboard"
          >
            Dashboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
