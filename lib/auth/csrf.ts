import { SignJWT, jwtVerify } from "jose";
import { getSessionFromCookies, type SessionPayload } from "@/lib/auth/session";

export const CSRF_FIELD_NAME = "csrfToken";

type CsrfPayload = {
  kind: "csrf";
  userId?: string;
};

function csrfSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function createCsrfToken(session?: SessionPayload | null) {
  const currentSession = session === undefined ? await getSessionFromCookies() : session;

  return new SignJWT({
    kind: "csrf",
    ...(currentSession?.userId ? { userId: currentSession.userId } : {})
  } satisfies CsrfPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(csrfSecret());
}

export async function verifyCsrfToken(
  token: FormDataEntryValue | string | null | undefined,
  { requireSession = false }: { requireSession?: boolean } = {}
) {
  if (typeof token !== "string" || token.length === 0) {
    return false;
  }

  try {
    const session = await getSessionFromCookies();
    const { payload } = await jwtVerify(token, csrfSecret());

    if (payload.kind !== "csrf") {
      return false;
    }

    if (typeof payload.userId === "string") {
      return session?.userId === payload.userId;
    }

    return !requireSession;
  } catch {
    return false;
  }
}

export async function assertValidCsrfToken(formData: FormData) {
  const valid = await verifyCsrfToken(formData.get(CSRF_FIELD_NAME), { requireSession: true });

  if (!valid) {
    throw new Error("Invalid CSRF token.");
  }
}
