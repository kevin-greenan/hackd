import { afterEach, describe, expect, it } from "vitest";
import { sessionCookieOptions, sessionCookieSecure } from "@/lib/auth/session";

const originalAppUrl = process.env.APP_URL;
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.APP_URL = originalAppUrl;
  process.env.NODE_ENV = originalNodeEnv;
});

describe("session cookie options", () => {
  it("does not mark cookies secure for an http public URL", () => {
    process.env.APP_URL = "http://localhost:3000";
    process.env.NODE_ENV = "production";

    expect(sessionCookieSecure()).toBe(false);
    expect(sessionCookieOptions().secure).toBe(false);
  });

  it("marks cookies secure for an https public URL", () => {
    process.env.APP_URL = "https://hackd.example.com";
    process.env.NODE_ENV = "production";

    expect(sessionCookieSecure()).toBe(true);
    expect(sessionCookieOptions().secure).toBe(true);
  });

  it("falls back to NODE_ENV when APP_URL is unset", () => {
    delete process.env.APP_URL;
    process.env.NODE_ENV = "production";

    expect(sessionCookieSecure()).toBe(true);
  });
});
