import { ContentStatus, Role } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { canDownloadAttachment, validateAttachmentFile } from "@/lib/core/challenge-attachments";

describe("challenge attachment validation", () => {
  it("accepts a small allowed document", () => {
    expect(
      validateAttachmentFile({
        fileName: "review-notes.md",
        mimeType: "text/markdown",
        sizeBytes: 128,
        maxBytes: 1024
      })
    ).toEqual({
      safeName: "review-notes.md",
      mimeType: "text/markdown"
    });
  });

  it("rejects unsafe file names", () => {
    expect(() =>
      validateAttachmentFile({
        fileName: "../secret.txt",
        mimeType: "text/plain",
        sizeBytes: 128,
        maxBytes: 1024
      })
    ).toThrow("filename");
  });

  it("rejects disallowed extensions", () => {
    expect(() =>
      validateAttachmentFile({
        fileName: "payload.exe",
        mimeType: "application/octet-stream",
        sizeBytes: 128,
        maxBytes: 1024
      })
    ).toThrow("file type");
  });

  it("rejects oversized files", () => {
    expect(() =>
      validateAttachmentFile({
        fileName: "sample.txt",
        mimeType: "text/plain",
        sizeBytes: 2048,
        maxBytes: 1024
      })
    ).toThrow("size");
  });

  it("allows admins to download attachments regardless of publication state", () => {
    expect(
      canDownloadAttachment({
        role: Role.ADMIN,
        challengeStatus: ContentStatus.DRAFT,
        modules: []
      })
    ).toBe(true);
  });

  it("allows learners assigned to a published module with a published challenge", () => {
    expect(
      canDownloadAttachment({
        role: Role.LEARNER,
        challengeStatus: ContentStatus.PUBLISHED,
        modules: [
          {
            status: ContentStatus.PUBLISHED,
            assignmentCount: 1
          }
        ]
      })
    ).toBe(true);
  });

  it("rejects learners when the challenge or module is not published", () => {
    expect(
      canDownloadAttachment({
        role: Role.LEARNER,
        challengeStatus: ContentStatus.DRAFT,
        modules: [
          {
            status: ContentStatus.PUBLISHED,
            assignmentCount: 1
          }
        ]
      })
    ).toBe(false);
    expect(
      canDownloadAttachment({
        role: Role.LEARNER,
        challengeStatus: ContentStatus.PUBLISHED,
        modules: [
          {
            status: ContentStatus.DRAFT,
            assignmentCount: 1
          }
        ]
      })
    ).toBe(false);
  });

  it("rejects learners without a matching assignment", () => {
    expect(
      canDownloadAttachment({
        role: Role.LEARNER,
        challengeStatus: ContentStatus.PUBLISHED,
        modules: [
          {
            status: ContentStatus.PUBLISHED,
            assignmentCount: 0
          }
        ]
      })
    ).toBe(false);
  });
});
