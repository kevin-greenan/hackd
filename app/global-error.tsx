"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(
    JSON.stringify({
      level: "error",
      event: "ui.global_error",
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString()
    })
  );

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-12 font-sans">
          <section className="w-full rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
              Application error
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Something went wrong</h1>
            <p className="mt-3 text-slate-600">
              The application shell could not be rendered. Retry the view, or reload the page if the problem continues.
            </p>
            <button
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              onClick={() => reset()}
              type="button"
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
