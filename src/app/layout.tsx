import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen bg-[#F7F8F6] text-[#171A18]`}
        style={{ fontFamily: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif" }}
      >
        <main className="w-full flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
