import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { createCsrfToken, verifyCsrfToken } from "@/lib/auth/csrf";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

const cookieValues = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);

      return value ? { value } : undefined;
    }
  }))
}));

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", "test-session-secret-with-at-least-32-chars");
  cookieValues.clear();
});

describe("CSRF tokens", () => {
  it("creates anonymous tokens that verify for pre-login forms", async () => {
    const token = await createCsrfToken(null);

    expect(await verifyCsrfToken(token)).toBe(true);
    expect(await verifyCsrfToken(token, { requireSession: true })).toBe(false);
  });

  it("rejects missing and tampered tokens", async () => {
    const token = await createCsrfToken(null);

    expect(await verifyCsrfToken(null)).toBe(false);
    expect(await verifyCsrfToken(`${token}tampered`)).toBe(false);
  });

  it("binds authenticated tokens to the active session", async () => {
    const sessionToken = await createSessionToken({
      userId: "user-1",
      email: "learner@example.com",
      role: Role.LEARNER
    });
    cookieValues.set(SESSION_COOKIE_NAME, sessionToken);

    const csrfToken = await createCsrfToken();

    expect(await verifyCsrfToken(csrfToken)).toBe(true);

    cookieValues.clear();

    expect(await verifyCsrfToken(csrfToken)).toBe(false);
  });
});
