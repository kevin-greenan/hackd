import type { NextRequest } from "next/server";

export function getPublicUrl(request: NextRequest, path: string) {
  const configuredAppUrl = process.env.APP_URL;

  if (configuredAppUrl) {
    return new URL(path, configuredAppUrl);
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";

  if (host) {
    return new URL(path, `${proto}://${host}`);
  }

  return new URL(path, request.url);
}
