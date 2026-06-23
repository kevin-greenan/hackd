import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "hackd_session";

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function readSessionToken(token?: string): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "LEARNER")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function sessionCookieSecure() {
  if (process.env.APP_URL) {
    return process.env.APP_URL.startsWith("https://");
  }

  return process.env.NODE_ENV === "production";
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: sessionCookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  };
}
