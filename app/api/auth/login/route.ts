import { NextResponse, type NextRequest } from "next/server";
import { UserStatus } from "@prisma/client";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function redirectToLogin(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, request.url), 303);
}

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimit = checkRateLimit(`login:${ipAddress}`);

  if (!rateLimit.allowed) {
    return redirectToLogin(request, "rate_limited");
  }

  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return redirectToLogin(request, "invalid");
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== UserStatus.ACTIVE) {
    return redirectToLogin(request, "invalid");
  }

  const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    return redirectToLogin(request, "invalid");
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });
  const response = NextResponse.redirect(new URL("/dashboard", request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());

  return response;
}
