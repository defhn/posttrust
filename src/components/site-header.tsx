"use client";

import Link from "next/link";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { CreditCard, History, Shield, SlidersHorizontal } from "lucide-react";

interface SiteHeaderUser {
  id: string;
  email: string;
  credits: number;
  hasVoiceProfile?: boolean;
  hasBilling?: boolean;
  subscriptionStatus?: string | null;
}

interface SiteHeaderProps {
  user: SiteHeaderUser | null;
  onSignIn?: () => void;
}

export default function SiteHeader({ user, onSignIn }: SiteHeaderProps) {
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleBillingPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Billing portal is not available yet.");
      }

      window.location.href = data.url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Billing portal is not available yet.");
      setIsOpeningPortal(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#171A18]/8 bg-white/92 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="PostTrust home">
          <span className="w-7 h-7 rounded-md bg-[#176B4D] flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </span>
          <span className="font-bold text-[#171A18] text-[15px] tracking-tight">PostTrust</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#171A18]/65">
          <Link href="/#how-it-works" className="hover:text-[#171A18] transition-colors">How it works</Link>
          <Link href="/#pricing" className="hover:text-[#171A18] transition-colors">Pricing</Link>
          <Link href="/#faq" className="hover:text-[#171A18] transition-colors">FAQ</Link>
          {user && (
            <>
              <Link href="/history" className="inline-flex items-center gap-1.5 hover:text-[#171A18] transition-colors">
                <History className="h-3.5 w-3.5" />
                History
              </Link>
              <Link href="/voice" className="inline-flex items-center gap-1.5 hover:text-[#171A18] transition-colors">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Voice Profile
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center justify-end gap-3 min-w-0">
          {user ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-[#176B4D]/10 text-[#176B4D] border border-[#176B4D]/20 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176B4D]" />
                {user.credits} audits left
              </span>
              {user.hasBilling && (
                <button
                  type="button"
                  onClick={handleBillingPortal}
                  disabled={isOpeningPortal}
                  className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-[#171A18]/65 hover:text-[#171A18] disabled:opacity-50 cursor-pointer"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Billing
                </button>
              )}
              <span className="hidden xl:inline truncate max-w-[180px] text-xs text-[#171A18]/50 font-mono">
                {user.email}
              </span>
              <UserButton />
            </>
          ) : (
            onSignIn ? (
              <button
                type="button"
                onClick={onSignIn}
                className="text-sm font-semibold text-[#176B4D] hover:text-[#0F4D36] transition-colors cursor-pointer whitespace-nowrap"
              >
                Sign in
              </button>
            ) : (
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-[#176B4D] hover:text-[#0F4D36] transition-colors whitespace-nowrap"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
