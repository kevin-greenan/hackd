import { AssignmentStatus } from "@prisma/client";

export type CompletionLike = {
  status: AssignmentStatus;
};

export function calculateCompletionPercent(completions: CompletionLike[], totalAssignments: number) {
  if (totalAssignments <= 0) {
    return 0;
  }

  const completedCount = completions.filter(
    (completion) => completion.status === AssignmentStatus.COMPLETED
  ).length;

  return Math.round((completedCount / totalAssignments) * 100);
}

export function summarizeCompletionStatus(completions: CompletionLike[], totalAssignments: number) {
  const completed = completions.filter(
    (completion) => completion.status === AssignmentStatus.COMPLETED
  ).length;
  const inProgress = completions.filter(
    (completion) => completion.status === AssignmentStatus.IN_PROGRESS
  ).length;
  const notStarted = Math.max(totalAssignments - completed - inProgress, 0);

  return {
    completed,
    inProgress,
    notStarted,
    percent: calculateCompletionPercent(completions, totalAssignments)
  };
}
