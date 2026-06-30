"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, CreditCard, ArrowRight } from "lucide-react";
import AppShell from "@/components/app-shell";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"polling" | "success" | "error">("polling");
  const [balance, setBalance] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/billing/status?session_id=${sessionId}`);
        if (!response.ok) throw new Error("Status check failed");
        
        const data = await response.json();
        
        if (data.completed) {
          setBalance(data.balance);
          setStatus("success");
        } else {
          // Keep polling, max 15 retries (30 seconds)
          if (retryCount < 15) {
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, 2000);
          } else {
            setStatus("error");
          }
        }
      } catch (error) {
        console.error("Error polling billing status:", error);
        setStatus("error");
      }
    };

    checkStatus();
  }, [sessionId, retryCount]);

  if (status === "polling") {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-[#F7F8F6] border border-[#171A18]/10 rounded-lg shadow-sm">
        <Loader2 className="h-10 w-10 animate-spin text-[#176B4D] mb-4" />
        <h2 className="text-xl font-semibold text-[#171A18] mb-2 font-sans">
          Confirming your purchase...
        </h2>
        <p className="text-sm text-[#171A18]/70">
          We are waiting for Stripe to confirm your payment. This will only take a moment.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-[#F7F8F6] border border-[#176B4D]/20 rounded-lg shadow-sm">
        <CheckCircle2 className="h-12 w-12 text-[#176B4D] mb-4" />
        <h2 className="text-2xl font-bold text-[#171A18] mb-2 font-sans">
          Payment Successful!
        </h2>
        <p className="text-sm text-[#171A18]/70 mb-6">
          Your credits have been added. You can now publish and edit posts with maximum confidence.
        </p>

        {balance !== null && (
          <div className="bg-[#176B4D]/5 border border-[#176B4D]/10 rounded px-4 py-3 w-full mb-6 flex justify-between items-center text-left">
            <span className="text-sm text-[#171A18]/70 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#176B4D]" />
              New credit balance
            </span>
            <span className="text-lg font-bold text-[#176B4D]">{balance} audits left</span>
          </div>
        )}

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-[#176B4D] hover:bg-[#12533B] text-white font-medium text-sm px-6 py-3 rounded transition-colors w-full cursor-pointer h-11"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-[#F7F8F6] border border-[#B5473C]/20 rounded-lg shadow-sm">
      <div className="bg-[#B5473C]/10 text-[#B5473C] p-3 rounded-full mb-4">
        <CreditCard className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold text-[#171A18] mb-2 font-sans">
        Status check timed out
      </h2>
      <p className="text-sm text-[#171A18]/70 mb-6">
        We couldn&apos;t immediately confirm the status from Stripe. Don&apos;t worry, your credits will be applied shortly once the webhook is completed.
      </p>
      
      <Link
        href="/"
        className="inline-flex items-center justify-center bg-[#171A18] hover:bg-black text-white font-medium text-sm px-6 py-3 rounded transition-colors w-full cursor-pointer h-11"
      >
        Return to Homepage
      </Link>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <AppShell
      user={null}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Billing" },
      ]}
    >
      <div className="flex justify-center py-8">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-[#F7F8F6] border border-[#171A18]/10 rounded-lg shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-[#176B4D] mb-4" />
          <h2 className="text-xl font-semibold text-[#171A18] mb-2">Loading...</h2>
        </div>
      }>
        <SuccessContent />
      </Suspense>
      </div>
    </AppShell>
  );
}
