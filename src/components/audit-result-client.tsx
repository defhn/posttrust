"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Shield, Check, Copy, HelpCircle, 
  ChevronLeft, ArrowRight, CornerDownRight, FileText
} from "lucide-react";

interface AuditResultProps {
  auditId: string;
  input: string;
  options: {
    type: "post" | "article";
    audience?: string;
    goal?: string;
    tone?: boolean;
  };
  result: {
    overallScore: number;
    confidence: "High" | "Medium" | "Low";
    verdict: string;
    positives: string[];
    topProblems: Array<{ category: string; reason: string; suggestion: string }>;
    metrics: Array<{ category: string; displayName: string; score: number; level: "Low" | "Medium" | "High"; description: string }>;
    annotations: Array<{ originalTextSnippet: string; problemCategory: string; riskExplanation: string; fixSuggestion: string; actionType: "delete" | "replace" | "add_evidence" | "rewrite" }>;
    rewrites: { conservative: string; authentic: string };
    missingContextDetails: string[];
  };
  user: {
    id: string;
    email: string;
    credits: number;
  };
}

export default function AuditResultClient({ auditId, input, options, result, user }: AuditResultProps) {
  const [activeAnnIndex, setActiveAnnIndex] = useState<number | null>(result.annotations.length > 0 ? 0 : null);
  const [rewriteTab, setRewriteTab] = useState<"conservative" | "authentic">("authentic");
  const [copiedTab, setCopiedTab] = useState<"conservative" | "authentic" | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Copy text to clipboard
  const handleCopy = (text: string, type: "conservative" | "authentic") => {
    navigator.clipboard.writeText(text);
    setCopiedTab(type);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  // trustScore = 100 - overallScore (higher = better, more human/trustworthy)
  const trustScore = 100 - result.overallScore;

  // Color based on trustScore: high = green (good), low = red (bad)
  const getScoreColorClass = (ts: number) => {
    if (ts >= 70) return "text-[#176B4D] bg-[#176B4D]/10 border-[#176B4D]/25";
    if (ts >= 40) return "text-[#B7791F] bg-[#B7791F]/10 border-[#B7791F]/25";
    return "text-[#B5473C] bg-[#B5473C]/10 border-[#B5473C]/25";
  };

  // Helper to parse original draft and render it with interactive highlighted blocks
  const renderAnnotatedDraft = () => {
    const annotations = result.annotations;
    if (annotations.length === 0) {
      return (
        <div className="whitespace-pre-line text-[#171A18]/85 leading-relaxed" suppressHydrationWarning>
          {input}
        </div>
      );
    }

    // Sort annotations by their occurrence in the input text to replace sequentially
    const occurrences = annotations
      .map((ann, idx) => ({ ann, idx, index: input.indexOf(ann.originalTextSnippet) }))
      .filter((o) => o.index !== -1)
      .sort((a, b) => a.index - b.index);

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    occurrences.forEach((occ) => {
      const start = occ.index;
      // Ensure we don't overlap previous highlights
      if (start < lastIndex) return;

      // Add plain text before match
      if (start > lastIndex) {
        parts.push(
          <span key={`text_${lastIndex}`} className="whitespace-pre-line text-[#171A18]/80 leading-relaxed font-sans">
            {input.substring(lastIndex, start)}
          </span>
        );
      }

      // Add clickable highlighted text snippet
      const isActive = activeAnnIndex === occ.idx;

      // Select appropriate theme coloring
      const isCliché = occ.ann.problemCategory.toLowerCase().includes("cliché") || occ.ann.problemCategory.toLowerCase().includes("buzzword");
      const highlightBg = isCliché ? "bg-[#B5473C]/10 hover:bg-[#B5473C]/15" : "bg-[#B7791F]/10 hover:bg-[#B7791F]/15";
      const highlightBorder = isCliché ? "border-[#B5473C] text-[#B5473C]" : "border-[#B7791F] text-[#B7791F]";

      parts.push(
        <button
          key={`ann_${occ.idx}`}
          type="button"
          onClick={() => setActiveAnnIndex(occ.idx)}
          className={`inline transition-all border-b-2 cursor-pointer rounded-sm px-1 py-0.5 font-sans font-medium text-left ${highlightBg} ${
            isActive ? `${highlightBorder} border-solid font-semibold ring-1 ring-offset-1 ring-current` : "border-dashed border-current"
          }`}
          title="Click to inspect this warning"
        >
          {occ.ann.originalTextSnippet}
        </button>
      );

      lastIndex = start + occ.ann.originalTextSnippet.length;
    });

    // Add trailing text
    if (lastIndex < input.length) {
      parts.push(
        <span key="text_end" className="whitespace-pre-line text-[#171A18]/80 leading-relaxed font-sans">
          {input.substring(lastIndex)}
        </span>
      );
    }

    // Wrap in a stable container to prevent browser extension DOM mutations
    // from causing React removeChild errors during state transitions
    return (
      <div suppressHydrationWarning className="leading-relaxed">
        {parts}
      </div>
    );
  };

  const handlePricingRedirect = (url: string) => {
    if (!/^https:\/\/buy\.stripe\.com\/.+/.test(url) || /\/test_[123](?:\?|$)/.test(url)) {
      setCheckoutError("Checkout is not configured yet. Add the real Stripe Payment Link URL to NEXT_PUBLIC_STRIPE_LINK_QUICK_FIX first.");
      return;
    }
    const separator = url.includes("?") ? "&" : "?";
    window.location.href = `${url}${separator}client_reference_id=${user.id}`;
  };

  return (
    <div className="flex-1 bg-[#F7F8F6] min-h-screen pb-16">
      
      {/* Top Header Row */}
      <header className="h-[60px] border-b border-[#171A18]/8 px-4 md:px-8 bg-white flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1 rounded-full hover:bg-[#171A18]/5 text-[#171A18]/70 hover:text-[#171A18] transition-all cursor-pointer"
            title="Return to home"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="h-4 w-px bg-[#171A18]/15" />
          <span className="font-sans font-bold text-sm text-[#171A18]">Audit Results</span>
          <span className="text-[10px] font-mono text-[#171A18]/40 select-all hidden sm:inline">#{auditId}</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="bg-[#176B4D]/10 text-[#176B4D] border border-[#176B4D]/25 px-2.5 py-1 rounded">
            {user.credits} audits left
          </span>
          <Link 
            href="/" 
            className="bg-[#176B4D] hover:bg-[#12533B] text-white px-4 py-2 rounded transition-colors font-sans flex items-center gap-1 cursor-pointer"
          >
            Audit New {options.type === "article" ? "Article" : "Post"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Grid Dashboard */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8 font-sans">
        
        {/* Row 1: Overall Summary */}
        <section className="bg-white border-editorial rounded-lg p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center shadow-2xs">
          
          {/* Circular/Large Score Card */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#171A18]/50 font-sans">
              Trust Score
            </span>
            <div className={`flex items-baseline gap-1 font-mono px-4 py-2 border rounded-md text-3xl font-extrabold ${getScoreColorClass(trustScore)}`}>
              {trustScore}
              <span className="text-sm font-normal text-current/60">/100</span>
            </div>
            <span className="text-[10px] text-[#171A18]/45 mt-1 block">
              Confidence level: <strong>{result.confidence}</strong>
            </span>
          </div>

          {/* Verdict Text */}
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#171A18]/65 font-sans">
              <Shield className="h-4 w-4 text-[#176B4D]" />
              Trust Diagnostic Verdict
            </div>
            <p className="text-sm md:text-base text-[#171A18] font-medium leading-relaxed font-sans">
              {result.verdict}
            </p>
          </div>

        </section>

        {/* Row 2: Diagnostic Split Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Annotated Original Draft */}
          <div className="lg:col-span-7 bg-white border border-[#171A18]/10 rounded-lg overflow-hidden shadow-2xs">
            <div className="border-b border-[#171A18]/10 bg-[#F7F8F6] px-5 py-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#171A18] flex items-center gap-1.5 font-sans">
                <FileText className="h-4 w-4 text-[#171A18]/60" />
                Your Annotated Draft
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#171A18]/45">
                Click highlight to inspect
              </span>
            </div>
            
            <div className="p-6 font-sans text-sm leading-relaxed min-h-[300px]">
              {renderAnnotatedDraft()}
            </div>

            {/* Inline warning inspector at the bottom of draft */}
            {activeAnnIndex !== null && result.annotations[activeAnnIndex] && (
              <div className="border-t border-[#171A18]/10 bg-[#F7F8F6]/50 p-5 space-y-3 font-sans animate-slideDown">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-[#171A18]/50 block">Risk Category</span>
                    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded border border-[#B5473C] text-[#B5473C] bg-[#B5473C]/5">
                      {result.annotations[activeAnnIndex].problemCategory}
                    </span>
                  </div>
                  <button 
                    onClick={() => setActiveAnnIndex(null)}
                    className="text-xs text-[#171A18]/45 hover:text-[#171A18] font-bold cursor-pointer"
                  >
                    Clear Focus
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[9px] uppercase font-bold text-[#171A18]/50 block">Why it hurts trust</span>
                  <p className="text-[#171A18] leading-relaxed">{result.annotations[activeAnnIndex].riskExplanation}</p>
                </div>

                <div className="bg-white border-editorial rounded p-3 text-xs space-y-1">
                  <span className="text-[9px] uppercase font-bold text-[#176B4D] flex items-center gap-1 font-semibold">
                    <CornerDownRight className="h-3.5 w-3.5 text-[#176B4D]" />
                    Suggested Fix Strategy ({result.annotations[activeAnnIndex].actionType})
                  </span>
                  <p className="text-[#171A18]/90 leading-relaxed font-sans">{result.annotations[activeAnnIndex].fixSuggestion}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Authentic Rewrites */}
          <div className="lg:col-span-5 bg-white border border-[#171A18]/10 rounded-lg overflow-hidden shadow-2xs">
            {/* Tabs Selector */}
            <div className="flex border-b border-[#171A18]/10 bg-[#F7F8F6]">
              <button
                onClick={() => setRewriteTab("authentic")}
                className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-colors ${
                  rewriteTab === "authentic" ? "bg-white text-[#176B4D] border-t-2 border-[#176B4D]" : "text-[#171A18]/60 hover:text-[#171A18]"
                }`}
              >
                Authentic Rewrite
              </button>
              <button
                onClick={() => setRewriteTab("conservative")}
                className={`flex-1 py-3 text-xs font-bold text-center cursor-pointer transition-colors ${
                  rewriteTab === "conservative" ? "bg-white text-[#176B4D] border-t-2 border-[#176B4D]" : "text-[#171A18]/60 hover:text-[#171A18]"
                }`}
              >
                Conservative Rewrite
              </button>
            </div>

            {/* Tab content panel */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#176B4D] bg-[#176B4D]/5 px-2 py-0.5 rounded border border-[#176B4D]/15 font-sans">
                  {rewriteTab === "authentic" ? "Authentic Variant" : "Conservative Variant"}
                </span>
                
                <button
                  onClick={() => handleCopy(
                    rewriteTab === "authentic" ? result.rewrites.authentic : result.rewrites.conservative, 
                    rewriteTab
                  )}
                  className="inline-flex items-center gap-1 text-xs text-[#176B4D] font-bold hover:underline cursor-pointer"
                >
                  {copiedTab === rewriteTab ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-[#171A18]/70 leading-normal font-sans bg-[#F7F8F6]/40 p-3 rounded border border-editorial">
                {rewriteTab === "authentic" ? (
                  <p>
                    <strong>Authentic Rewrite:</strong> Standard restructuring utilizing bracketed placeholders like <span className="font-mono bg-[#176B4D]/10 text-[#176B4D] px-1 rounded">[insert your data point]</span>. These help anchor your experience without fabricating stories.
                  </p>
                ) : (
                  <p>
                    <strong>Conservative Rewrite:</strong> Preserves your original paragraph flow and sentences, but cleanses buzzwords and lowers preachy lectures.
                  </p>
                )}
              </div>

              <div className="font-sans text-sm leading-relaxed whitespace-pre-line text-[#171A18] bg-white p-2 min-h-[220px]">
                {rewriteTab === "authentic" ? result.rewrites.authentic : result.rewrites.conservative}
              </div>
            </div>
          </div>

        </section>

        {/* Row 3: Gaps & Clarifying Questions */}
        {result.missingContextDetails.length > 0 && (
          <section className="bg-[#176B4D]/5 border border-[#176B4D]/15 rounded-lg p-6 space-y-4 shadow-2xs font-sans">
            <h3 className="text-sm font-bold text-[#176B4D] flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-[#176B4D]" />
              Clarifying details needed for maximum trust
            </h3>
            <p className="text-xs text-[#171A18]/80 leading-normal font-sans">
              To fully unlock the &ldquo;Authentic Rewrite&rdquo;, fill in the bracketed placeholders by answering these specific details:
            </p>
            <ul className="text-xs space-y-2.5 text-[#171A18] pl-5 list-disc leading-relaxed">
              {result.missingContextDetails.map((q, idx) => (
                <li key={idx} className="font-medium">
                  {q}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Row 4: Metrics Breakdown */}
        <section className="bg-white border border-[#171A18]/10 rounded-lg p-6 space-y-6 shadow-2xs font-sans">
          <h3 className="text-sm font-bold text-[#171A18] font-sans">
            Detailed Friction Metrics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {result.metrics.map((metric, idx) => {
              const isHigh = metric.level === "High";
              const isMed = metric.level === "Medium";
              const levelColor = isHigh ? "text-[#B5473C] bg-[#B5473C]/5" : isMed ? "text-[#B7791F] bg-[#B7791F]/5" : "text-[#176B4D] bg-[#176B4D]/5";
              const levelBorder = isHigh ? "border-[#B5473C]/20" : isMed ? "border-[#B7791F]/20" : "border-[#176B4D]/20";

              return (
                <div key={idx} className={`border p-4 rounded-lg flex flex-col justify-between space-y-3 bg-[#F7F8F6]/25 ${levelBorder}`}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#171A18]/60 uppercase tracking-wider block font-sans">
                      {metric.displayName}
                    </span>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${levelColor} ${levelBorder} font-sans`}>
                      {metric.level} Risk
                    </span>
                  </div>
                  <p className="text-xs text-[#171A18]/75 leading-relaxed font-sans">
                    {metric.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Upsell Banner at bottom */}
        {user.credits <= 1 && (
          <section className="bg-[#171A18] text-white border border-black rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md font-sans">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#176B4D] bg-[#176B4D]/15 px-2 py-0.5 rounded border border-[#176B4D]/35 font-sans">
                Save time publishing
              </span>
              <h3 className="text-lg font-bold font-sans">
                Keep the same quality standard for your next posts.
              </h3>
              <p className="text-xs text-white/70 max-w-md leading-relaxed font-sans">
                Upgrade now to ensure every single draft you write is verified for professional trust before it goes public.
              </p>
            </div>
            
            <button
              onClick={() => handlePricingRedirect(process.env.NEXT_PUBLIC_STRIPE_LINK_QUICK_FIX || "")}
              className="px-6 py-3 bg-[#176B4D] hover:bg-[#12533B] text-white text-xs font-bold rounded cursor-pointer transition-colors shrink-0 flex items-center gap-1"
            >
              Get 3 more audits for $9
              <ArrowRight className="h-4 w-4" />
            </button>
            {checkoutError && (
              <p className="text-xs text-white/65 text-center md:text-right max-w-xs">{checkoutError}</p>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
