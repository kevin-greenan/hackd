import { AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/card";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAdminAuditLogs } from "@/lib/core/audit-log";
import { formatAdminLabel } from "@/lib/core/admin-lists";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatMetadata(metadata: unknown) {
  if (metadata === null || metadata === undefined) {
    return "No metadata";
  }

  return JSON.stringify(metadata);
}

export default async function AdminAuditPage() {
  const user = await requireAdmin();
  const auditLogs = await getAdminAuditLogs();

  return (
    <AppShell user={user} area="admin">
      <div className="mb-6">
        <ButtonLink href="/admin" variant="secondary">
          Back to admin
        </ButtonLink>
      </div>
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Audit</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Admin audit log</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Review recent admin mutations and their target records.
        </p>
      </section>
      <section className="mt-8">
        <Card>
          <AdminTable
            columns={["Action", "Actor", "Target", "Metadata", "Created"]}
            emptyTitle="No audit logs"
            emptyDescription="Admin mutation events will appear here after changes are saved."
            rows={auditLogs.map((log) => [
              <StatusBadge key="action">{formatAdminLabel(log.action)}</StatusBadge>,
              <div key="actor">
                <p className="font-semibold">{log.actorName}</p>
                {log.actorEmail ? (
                  <p className="text-xs text-muted-foreground">{log.actorEmail}</p>
                ) : null}
              </div>,
              <div key="target">
                <p className="font-semibold">
                  {log.targetType ? formatAdminLabel(log.targetType) : "unknown"}
                </p>
                <p className="text-xs text-muted-foreground">{log.targetId ?? "missing-target"}</p>
              </div>,
              <code className="block max-w-md whitespace-pre-wrap break-words rounded-md bg-surface px-2 py-1 text-xs" key="metadata">
                {formatMetadata(log.metadata)}
              </code>,
              <span key="created">{formatDateTime(log.createdAt)}</span>
            ])}
          />
        </Card>
      </section>
    </AppShell>
  );
}
