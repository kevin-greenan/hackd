import type { ReactNode } from "react";
import { EmptyState } from "@/components/card";

export function AdminTable({
  columns,
  rows,
  emptyTitle,
  emptyDescription
}: {
  columns: string[];
  rows: ReactNode[][];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {columns.map((column) => (
              <th className="py-3 pr-4 font-semibold last:pr-0" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="border-b border-border last:border-0" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="py-3 pr-4 align-top last:pr-0" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-primary/10 text-primary",
    warning: "bg-amber-100 text-amber-800"
  };

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
