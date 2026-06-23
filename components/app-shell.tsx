import Link from "next/link";
import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/button";

export function AppShell({
  children,
  user,
  area
}: {
  children: ReactNode;
  user: { name: string; email: string; role: Role };
  area: "learner" | "admin";
}) {
  const adminLinks = [
    { href: "/admin/users", label: "Users" },
    { href: "/admin/groups", label: "Groups" },
    { href: "/admin/modules", label: "Modules" },
    { href: "/admin/challenges", label: "Challenges" },
    { href: "/admin/assignments", label: "Assignments" }
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-white/86 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              hackd
            </Link>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              {area === "admin" ? "Admin control plane" : "Learner workspace"}
            </p>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted" href="/dashboard">
              Dashboard
            </Link>
            {user.role === "ADMIN" ? (
              <>
                <Link className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted" href="/admin">
                  Admin
                </Link>
                {area === "admin"
                  ? adminLinks.map((link) => (
                      <Link
                        className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted"
                        href={link.href}
                        key={link.href}
                      >
                        {link.label}
                      </Link>
                    ))
                  : null}
              </>
            ) : null}
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="secondary">
                Logout
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
