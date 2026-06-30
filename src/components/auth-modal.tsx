"use client";

import { useState, useEffect } from "react";
import { X, Mail, Loader2, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, initialEmail = "", onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link. Please try again.");
      }

      setIsSuccess(true);
      setCountdown(60);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Something went wrong. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay backdrop */}
      <div 
        className="absolute inset-0 bg-[#171A18]/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal contents */}
      <div className="relative w-full max-w-md bg-[#F7F8F6] border border-[#171A18]/10 rounded-lg shadow-xl overflow-hidden p-6 z-10 mx-4 font-sans animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#171A18]/5 text-[#171A18]/70 hover:text-[#171A18] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-[#176B4D] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#171A18] mb-2">Check your inbox</h3>
            <p className="text-sm text-[#171A18]/80 leading-relaxed mb-6">
              We sent a passwordless magic login link to <strong className="text-[#171A18]">{email}</strong>. 
              Click the link in the email to verify and automatically proceed.
            </p>
            <div className="text-xs text-[#171A18]/50">
              {countdown > 0 ? (
                <span>Resend link in {countdown}s</span>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="text-[#176B4D] font-semibold hover:underline cursor-pointer"
                >
                  Resend Email
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#171A18] font-sans">
                Sign in to PostTrust
              </h3>
              <p className="text-xs text-[#171A18]/70 mt-1">
                We&apos;ll verify your email and save your draft automatically. No passwords needed.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-[#B5473C]/10 border border-[#B5473C]/20 text-[#B5473C] text-xs p-3 rounded leading-normal">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email-input" className="text-xs font-semibold text-[#171A18]/70 block">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#171A18]/40" />
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#171A18]/15 rounded text-sm text-[#171A18] placeholder-[#171A18]/45 focus:outline-hidden focus:ring-1 focus:ring-[#176B4D] focus:border-[#176B4D] transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 py-1">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-3.5 w-3.5 accent-[#176B4D] rounded border-[#171A18]/25 text-[#176B4D] cursor-pointer"
                disabled={isLoading}
              />
              <label htmlFor="consent-checkbox" className="text-xs text-[#171A18]/65 leading-relaxed cursor-pointer select-none">
                Subscribe to monthly writing tips and trust audits (optional). You can opt out at any time.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center h-11 bg-[#176B4D] hover:bg-[#12533B] disabled:bg-[#176B4D]/40 text-white font-medium text-sm rounded transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending login link...
                </>
              ) : (
                "Send Magic Link"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
