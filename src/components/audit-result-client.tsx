"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Shield, Check, Copy, HelpCircle, 
  ArrowRight, CornerDownRight, FileText, Loader2, WandSparkles
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
    rebuild?: { generatedAt: string; answerCount: number };
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
  const [authenticRewrite, setAuthenticRewrite] = useState(result.rewrites.authentic);
  const [evidenceAnswers, setEvidenceAnswers] = useState<Record<number, string>>({});
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);
  const [rebuildComplete, setRebuildComplete] = useState(Boolean(result.rebuild));
  const auditLabel = options.type === "article" ? "Article" : "Post";
  const evidenceQuestions = result.missingContextDetails.slice(0, 3);

  // Copy text to clipboard
  const handleCopy = (text: string, type: "conservative" | "authentic") => {
    navigator.clipboard.writeText(text);
    setCopiedTab(type);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  // trustScore = 100 - overallScore (higher = better, more human/trustworthy)
  const trustScore = 100 - result.overallScore;

  // Placeholder fill state for authentic rewrite: key = "ph_N", value = user's text
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [copiedFinal, setCopiedFinal] = useState(false);

  // Score color: <60 red, 60-79 yellow, 80-89 light green, 90+ deep green
  const getScoreColorClass = (ts: number) => {
    if (ts >= 90) return "text-[#176B4D] bg-[#176B4D]/15 border-[#176B4D]/35";
    if (ts >= 80) return "text-[#2D8B5A] bg-[#2D8B5A]/10 border-[#2D8B5A]/25";
    if (ts >= 60) return "text-[#B7791F] bg-[#B7791F]/10 border-[#B7791F]/25";
    return "text-[#B5473C] bg-[#B5473C]/10 border-[#B5473C]/25";
  };

  const getScoreTier = (ts: number) => {
    if (ts >= 90) return { label: "Excellent", color: "text-[#176B4D]" };
    if (ts >= 80) return { label: "Good", color: "text-[#2D8B5A]" };
    if (ts >= 60) return { label: "Average", color: "text-[#B7791F]" };
    return { label: "Needs Work", color: "text-[#B5473C]" };
  };

  const scoreTier = getScoreTier(trustScore);

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
      const normalizedCategory = occ.ann.problemCategory.toLowerCase();
      const isCliche = normalizedCategory.includes("clich") || normalizedCategory.includes("buzzword");
      const highlightBg = isCliche ? "bg-[#B5473C]/10 hover:bg-[#B5473C]/15" : "bg-[#B7791F]/10 hover:bg-[#B7791F]/15";
      const highlightBorder = isCliche ? "border-[#B5473C] text-[#B5473C]" : "border-[#B7791F] text-[#B7791F]";

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

  // Parse authentic rewrite and render [placeholders] as interactive inline inputs
  const renderAuthenticRewrite = () => {
    const text = authenticRewrite;
    const regex = /\[([^\]]+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let phIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      // Text before placeholder
      if (match.index > lastIndex) {
        parts.push(
          <span key={`t_${lastIndex}`} className="whitespace-pre-line">
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }
      const key = `ph_${phIdx}`;
      const hint = match[1];
      const filled = placeholderValues[key] ?? "";
      parts.push(
        <span
          key={key}
          className={`inline-flex items-center mx-0.5 rounded px-1.5 py-0.5 text-xs font-semibold border transition-all ${
            filled
              ? "bg-[#176B4D]/10 border-[#176B4D]/30 text-[#176B4D]"
              : "bg-[#F59E0B]/12 border-[#F59E0B]/40 text-[#92400E]"
          }`}
        >
          <input
            type="text"
            placeholder={hint}
            value={filled}
            onChange={(e) =>
              setPlaceholderValues((prev) => ({ ...prev, [key]: e.target.value }))
            }
            className="bg-transparent outline-none placeholder-current/50 min-w-[60px] w-auto font-semibold"
            style={{ width: `${Math.max(filled.length || hint.length, 8)}ch` }}
            title={`Fill in: ${hint}`}
          />
        </span>
      );
      lastIndex = match.index + match[0].length;
      phIdx++;
    }

    // Trailing text
    if (lastIndex < text.length) {
      parts.push(
        <span key="t_end" className="whitespace-pre-line">
          {text.slice(lastIndex)}
        </span>
      );
    }

    const totalPlaceholders = phIdx;
    const filledCount = Object.values(placeholderValues).filter((v) => v.trim()).length;
    const allFilled = totalPlaceholders > 0 && filledCount >= totalPlaceholders;

    // Build the final copyable text with filled values
    const getFinalText = () => {
      let idx2 = 0;
      return text.replace(/\[([^\]]+)\]/g, () => {
        const val = placeholderValues[`ph_${idx2}`]?.trim();
        idx2++;
        return val || "[???]";
      });
    };

    return (
      <div suppressHydrationWarning>
        <div className="font-sans text-sm leading-relaxed text-[#171A18] bg-white p-2 min-h-[220px]">
          {parts}
        </div>
        {totalPlaceholders > 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-[#171A18]/8 pt-3">
            <span className="text-[10px] text-[#171A18]/45 font-mono">
              {filledCount}/{totalPlaceholders} placeholders filled
            </span>
            <button
              type="button"
              disabled={!allFilled}
              onClick={() => {
                navigator.clipboard.writeText(getFinalText());
                setCopiedFinal(true);
                setTimeout(() => setCopiedFinal(false), 2000);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                allFilled
                  ? "bg-[#176B4D] text-white hover:bg-[#0F4D36] cursor-pointer shadow-sm"
                  : "bg-[#171A18]/10 text-[#171A18]/35 cursor-not-allowed"
              }`}
            >
              {copiedFinal ? (
                <><Check className="h-3.5 w-3.5" /> Copied!</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy Final Post</>
              )}
            </button>
          </div>
        )}
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

  const handleRebuild = async () => {
    const answers = evidenceQuestions
      .map((question, index) => ({ question, answer: evidenceAnswers[index]?.trim() || "" }))
      .filter(({ answer }) => answer.length > 0);

    if (answers.length === 0) return;
    setIsRebuilding(true);
    setRebuildError(null);
    try {
      const response = await fetch(`/api/audits/${auditId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not rebuild this rewrite.");
      setAuthenticRewrite(data.authentic);
      setPlaceholderValues({});
      setRewriteTab("authentic");
      setRebuildComplete(true);
    } catch (error) {
      setRebuildError(error instanceof Error ? error.message : "Could not rebuild this rewrite.");
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#176B4D]">Audit Result</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#171A18]">{auditLabel} trust report</h1>
          <p className="mt-2 text-xs text-[#171A18]/45 font-mono select-all">#{auditId}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="bg-[#176B4D]/10 text-[#176B4D] border border-[#176B4D]/25 px-2.5 py-1 rounded">
            {user.credits} audits left
          </span>
          <Link
            href="/"
            className="bg-[#176B4D] hover:bg-[#12533B] text-white px-4 py-2 rounded transition-colors font-sans flex items-center gap-1 cursor-pointer"
          >
            Audit New {auditLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
        
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
            <span className={`text-[11px] font-bold mt-1 block ${scoreTier.color}`}>
              {scoreTier.label}
            </span>
            <span className="text-[10px] text-[#171A18]/40 block">
              Confidence: <strong>{result.confidence}</strong>
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
                    rewriteTab === "authentic" ? authenticRewrite : result.rewrites.conservative,
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

              <div className="font-sans text-sm leading-relaxed text-[#171A18]">
                {rewriteTab === "authentic"
                  ? renderAuthenticRewrite()
                  : <div className="whitespace-pre-line bg-white p-2 min-h-[220px]">{result.rewrites.conservative}</div>
                }
              </div>
            </div>
          </div>

        </section>

        {/* Row 3: Optional Evidence Refinement */}
        {evidenceQuestions.length > 0 && (
          <section className="rounded-lg border border-[#176B4D]/20 bg-[#176B4D]/5 p-5 font-sans shadow-2xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#176B4D] flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-[#176B4D]" />
                    Missing proof
                  </h3>
                  <span className="rounded border border-[#176B4D]/20 bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#176B4D]/75">
                    Optional
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#171A18]/70">
                  The rewrite above is ready to copy. Add 1-3 real details only if you want a sharper version with more proof.
                </p>
              </div>
              {!rebuildComplete && (
                <button
                  type="button"
                  onClick={() => setShowEvidenceForm((current) => !current)}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded bg-white px-3 text-xs font-bold text-[#176B4D] ring-1 ring-[#176B4D]/20 transition-colors hover:bg-[#176B4D]/8"
                >
                  <WandSparkles className="h-3.5 w-3.5" />
                  {showEvidenceForm ? "Hide detail fields" : "Improve with real details"}
                </button>
              )}
            </div>
            {rebuildComplete ? (
              <div className="mt-4 flex items-start gap-3 border border-[#176B4D]/20 bg-white p-4" role="status">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#176B4D]" />
                <div>
                  <p className="text-sm font-semibold text-[#171A18]">Sharper rewrite created</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#171A18]/60">Your details were used once to refresh the Authentic Rewrite. The answers themselves were not saved.</p>
                </div>
              </div>
            ) : showEvidenceForm ? (
              <>
                <div className="mt-5 space-y-4">
                  {evidenceQuestions.map((question, index) => (
                    <label key={question} className="block">
                      <span className="block text-xs font-semibold leading-relaxed text-[#171A18]">{question}</span>
                      <textarea
                        value={evidenceAnswers[index] || ""}
                        onChange={(event) => setEvidenceAnswers((current) => ({ ...current, [index]: event.target.value }))}
                        maxLength={1000}
                        rows={3}
                        placeholder="Add the real detail, number, decision, or result..."
                        className="mt-2 w-full resize-y border border-[#171A18]/15 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-[#176B4D] focus:ring-2 focus:ring-[#176B4D]/15"
                      />
                    </label>
                  ))}
                </div>
                {rebuildError && <p className="mt-4 text-xs font-medium text-[#B5473C]" role="alert">{rebuildError}</p>}
                <button
                  type="button"
                  onClick={handleRebuild}
                  disabled={isRebuilding || !Object.values(evidenceAnswers).some((answer) => answer.trim().length > 0)}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded bg-[#176B4D] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0F4D36] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRebuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                  {isRebuilding ? "Improving with your details..." : "Improve rewrite"}
                </button>
              </>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {evidenceQuestions.map((question) => (
                  <div key={question} className="rounded border border-[#176B4D]/15 bg-white p-3 text-xs font-medium leading-relaxed text-[#171A18]/75">
                    {question}
                  </div>
                ))}
              </div>
            )}
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
  );
}
