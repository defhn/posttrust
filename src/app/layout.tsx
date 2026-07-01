import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://posttrust.io"),
  title: "PostTrust | LinkedIn Credibility Audit & Authentic Rewriter",
  description: "Audit LinkedIn drafts for vague claims, recycled formulas, unsupported authority, and missing evidence before they damage professional trust.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PostTrust | LinkedIn Credibility Audit",
    description: "Write credible LinkedIn posts without sounding like an AI template or a fake thought leader.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PostTrust | LinkedIn Credibility Audit",
    description: "Write credible LinkedIn posts without performing thought leadership.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth" suppressHydrationWarning>
        <body
          className="min-h-screen bg-[#F7F8F6] text-[#171A18] antialiased"
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
        >
          <main className="flex min-h-screen w-full flex-col">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
