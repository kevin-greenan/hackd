CREATE INDEX "Assignment_dueAt_idx" ON "Assignment"("dueAt");
CREATE INDEX "Assignment_userId_moduleId_idx" ON "Assignment"("userId", "moduleId");
CREATE INDEX "Assignment_groupId_moduleId_idx" ON "Assignment"("groupId", "moduleId");
CREATE INDEX "Attempt_userId_challengeId_idx" ON "Attempt"("userId", "challengeId");
CREATE INDEX "Completion_userId_status_idx" ON "Completion"("userId", "status");
