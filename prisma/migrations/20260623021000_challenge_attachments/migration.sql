-- CreateTable
CREATE TABLE "ChallengeAttachment" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChallengeAttachment_challengeId_idx" ON "ChallengeAttachment"("challengeId");

-- CreateIndex
CREATE INDEX "ChallengeAttachment_createdById_idx" ON "ChallengeAttachment"("createdById");

-- AddForeignKey
ALTER TABLE "ChallengeAttachment" ADD CONSTRAINT "ChallengeAttachment_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeAttachment" ADD CONSTRAINT "ChallengeAttachment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
