import type { Metadata } from "next";
import { getBranding } from "@/lib/branding/theme";
import "./globals.css";

export function generateMetadata(): Metadata {
  const branding = getBranding();

  return {
    title: {
      default: branding.name,
      template: `%s | ${branding.name}`
    },
    description: branding.tagline
  };
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = getBranding();

  return (
    <html lang="en" style={branding.themeStyle}>
      <body>{children}</body>
    </html>
  );
}
