import { describe, expect, it } from "vitest";
import { validateAttachmentFile } from "@/lib/core/challenge-attachments";

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
});
