import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionCookieOptions, sessionCookieSecure } from "@/lib/auth/session";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session cookie options", () => {
  it("does not mark cookies secure for an http public URL", () => {
    vi.stubEnv("APP_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "production");

    expect(sessionCookieSecure()).toBe(false);
    expect(sessionCookieOptions().secure).toBe(false);
  });

  it("marks cookies secure for an https public URL", () => {
    vi.stubEnv("APP_URL", "https://hackd.example.com");
    vi.stubEnv("NODE_ENV", "production");

    expect(sessionCookieSecure()).toBe(true);
    expect(sessionCookieOptions().secure).toBe(true);
  });

  it("falls back to NODE_ENV when APP_URL is unset", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(sessionCookieSecure()).toBe(true);
  });
});
