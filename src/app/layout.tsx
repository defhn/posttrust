import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://posttrust.io"),
  title: "PostTrust | LinkedIn AI Slop Audit & Authentic Rewriter",
  description: "Audit your LinkedIn drafts for vague claims, clichés, and fake-expert lecturing. Make your posts sound experienced and build real business trust.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PostTrust | LinkedIn AI Slop Audit",
    description: "Make your LinkedIn posts sound experienced, not AI-generated. Find vague claims and fix clichés before publishing.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PostTrust | LinkedIn AI Slop Audit",
    description: "Make your LinkedIn posts sound experienced, not AI-generated.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className="antialiased min-h-screen bg-[#F7F8F6] text-[#171A18]"
        style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        <main className="w-full flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
