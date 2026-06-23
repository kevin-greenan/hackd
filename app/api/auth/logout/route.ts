import { NextResponse, type NextRequest } from "next/server";
import { verifyCsrfToken } from "@/lib/auth/csrf";
import { SESSION_COOKIE_NAME, sessionCookieSecure } from "@/lib/auth/session";
import { getPublicUrl } from "@/lib/http/public-url";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  if (!(await verifyCsrfToken(formData.get("csrfToken"), { requireSession: true }))) {
    return NextResponse.redirect(getPublicUrl(request, "/dashboard?error=unauthorized"), 303);
  }

  const response = NextResponse.redirect(getPublicUrl(request, "/"), 303);
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecure(),
    path: "/",
    maxAge: 0
  });

  return response;
}
