import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { ContentStatus, Role } from "@prisma/client";
import { prisma } from "../db/prisma";
import { logAdminAction } from "./audit-log";

export const DEFAULT_MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".c",
  ".conf",
  ".cpp",
  ".cs",
  ".css",
  ".csv",
  ".go",
  ".html",
  ".java",
  ".js",
  ".json",
  ".log",
  ".md",
  ".pdf",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".sh",
  ".sql",
  ".txt",
  ".ts",
  ".xml",
  ".yaml",
  ".yml",
  ".zip"
]);

const ALLOWED_MIME_TYPES = new Set([
  "application/json",
  "application/pdf",
  "application/sql",
  "application/x-sh",
  "application/xml",
  "application/zip",
  "text/css",
  "text/csv",
  "text/html",
  "text/javascript",
  "text/markdown",
  "text/plain",
  "text/x-c",
  "text/x-c++",
  "text/x-java-source",
  "text/x-python",
  "text/xml"
]);

export function getAttachmentStorageRoot() {
  return path.resolve(process.env.FILE_STORAGE_DIR ?? "/tmp/hackd-uploads");
}

export function getMaxAttachmentBytes() {
  const configured = Number(process.env.MAX_ATTACHMENT_BYTES);

  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_ATTACHMENT_BYTES;
}

export function validateAttachmentFile({
  fileName,
  mimeType,
  sizeBytes,
  maxBytes = getMaxAttachmentBytes()
}: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  maxBytes?: number;
}) {
  const baseName = path.basename(fileName).trim();
  const extension = path.extname(baseName).toLowerCase();
  const normalizedMimeType = mimeType.toLowerCase() || "application/octet-stream";

  if (!baseName || baseName !== fileName || baseName.includes("..")) {
    throw new Error("Attachment filename is not safe.");
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Attachment file type is not allowed.");
  }

  if (!ALLOWED_MIME_TYPES.has(normalizedMimeType) && normalizedMimeType !== "application/octet-stream") {
    throw new Error("Attachment MIME type is not allowed.");
  }

  if (sizeBytes <= 0 || sizeBytes > maxBytes) {
    throw new Error("Attachment file size is not allowed.");
  }

  return {
    safeName: baseName,
    mimeType: normalizedMimeType
  };
}

function attachmentStoragePath(challengeId: string, attachmentId: string, fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  return path.join(challengeId, `${attachmentId}${extension}`);
}

function resolveStoragePath(storagePath: string) {
  const root = getAttachmentStorageRoot();
  const resolvedPath = path.resolve(root, storagePath);

  if (!resolvedPath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Attachment storage path is not safe.");
  }

  return resolvedPath;
}

export async function createChallengeAttachment({
  actorUserId,
  challengeId,
  file
}: {
  actorUserId: string;
  challengeId: string;
  file: File;
}) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const { safeName, mimeType } = validateAttachmentFile({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: bytes.byteLength
  });
  const attachmentId = randomUUID();
  const storagePath = attachmentStoragePath(challengeId, attachmentId, safeName);
  const absolutePath = resolveStoragePath(storagePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes, { flag: "wx" });

  const attachment = await prisma.challengeAttachment.create({
    data: {
      id: attachmentId,
      challengeId,
      originalName: safeName,
      storagePath,
      mimeType,
      sizeBytes: bytes.byteLength,
      createdById: actorUserId
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.challenge_attachment.create",
    targetType: "challenge_attachment",
    targetId: attachment.id,
    metadata: {
      challengeId: attachment.challengeId,
      originalName: attachment.originalName,
      sizeBytes: attachment.sizeBytes,
      mimeType: attachment.mimeType
    }
  });

  return attachment;
}

export async function deleteChallengeAttachment({
  actorUserId,
  attachmentId
}: {
  actorUserId: string;
  attachmentId: string;
}) {
  const attachment = await prisma.challengeAttachment.findUnique({
    where: { id: attachmentId }
  });

  if (!attachment) {
    throw new Error("Attachment not found.");
  }

  await prisma.challengeAttachment.delete({
    where: { id: attachment.id }
  });
  await rm(resolveStoragePath(attachment.storagePath), { force: true });

  await logAdminAction({
    actorUserId,
    action: "admin.challenge_attachment.delete",
    targetType: "challenge_attachment",
    targetId: attachment.id,
    metadata: {
      challengeId: attachment.challengeId,
      originalName: attachment.originalName
    }
  });
}

export async function getDownloadableAttachment({
  attachmentId,
  userId,
  role
}: {
  attachmentId: string;
  userId: string;
  role: Role;
}) {
  const attachment = await prisma.challengeAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      challenge: {
        include: {
          modules: {
            include: {
              module: {
                include: {
                  assignments: {
                    where:
                      role === Role.ADMIN
                        ? {}
                        : {
                            OR: [
                              { userId },
                              {
                                group: {
                                  memberships: {
                                    some: { userId }
                                  }
                                }
                              }
                            ]
                          }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!attachment) {
    return null;
  }

  const canAccess =
    role === Role.ADMIN ||
    attachment.challenge.modules.some((moduleChallenge) => {
      return (
        attachment.challenge.status === ContentStatus.PUBLISHED &&
        moduleChallenge.module.status === ContentStatus.PUBLISHED &&
        moduleChallenge.module.assignments.length > 0
      );
    });

  if (!canAccess) {
    return null;
  }

  const bytes = await readFile(resolveStoragePath(attachment.storagePath));

  return {
    bytes,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes
  };
}
