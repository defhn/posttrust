"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DemoAudit from "./demo-audit";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";
import { 
  FileText, Shield, Sparkles, CheckCircle, Zap, 
  ArrowRight, ChevronDown, AlertCircle, 
  Loader2, ChevronRight
} from "lucide-react";

interface User {
  id: string;
  email: string;
  credits: number;
  hasVoiceProfile?: boolean;
  hasBilling?: boolean;
  subscriptionStatus?: string | null;
}

interface LandingClientProps {
  user: User | null;
}

const FAQ_ITEMS = [
  {
    question: "Is this an AI detector?",
    answer: "No. PostTrust evaluates writing quality and trust patterns, not author origin. A human can write empty, clich茅-heavy copy, and an AI can help produce specific, evidence-backed text. We highlight patterns that reduce professional credibility.",
  },
  {
    question: "Will you invent personal stories for me?",
    answer: "No. Unlike other tools, we do not fabricate stories or case studies. Instead, our authentic rewrites insert bracketed placeholders like '[insert your team size]' or '[insert metric here]' where specific data points would strengthen your post.",
  },
  {
    question: "Do I need to connect my LinkedIn account?",
    answer: "No. PostTrust is a pre-publish editor. You simply paste your text, review the analytics, copy the rewrite, and publish it on LinkedIn yourself. No OAuth credentials required.",
  },
  {
    question: "What happens to my drafts?",
    answer: "Drafts are stored securely in your private account so you can access your history across devices. You have full control to delete them at any time.",
  },
  {
    question: "Can I use my credits on another device?",
    answer: "Yes. Your audit credits are bound to your verified email address, not to a single browser. Logging in on any device restores your balance.",
  },
  {
    question: "Does Article audit work the same way?",
    answer: "For articles, we evaluate argument structure, clarity, and evidence density. The tool outputs section-by-section structural improvements rather than full rewrites for long-form content.",
  },
];

const AUDIT_DIMENSIONS = [
  {
    label: "Empty Language",
    color: "risk" as const,
    desc: "Broad truths like \u201cConsistency is key\u201d that lack context and leave the reader learning nothing.",
  },
  {
    label: "Fake-Expert Signals",
    color: "risk" as const,
    desc: "Preachy lectures that command readers what to do\u2014alienating high-value buyers who already know.",
  },
  {
    label: "LinkedIn Clich\u00e9s",
    color: "risk" as const,
    desc: "Tired engagement hooks, forced line breaks, and formatting templates that scream AI plugin.",
  },
  {
    label: "Missing Experience",
    color: "warning" as const,
    desc: "Theoretical advice written without referencing real projects, customer calls, or client observations.",
  },
  {
    label: "Missing Evidence",
    color: "warning" as const,
    desc: "Statements without numbers, timelines, or specific variables that anchor claims in reality.",
  },
  {
    label: "Perfect Flow",
    color: "safe" as const,
    desc: "Stories that are too neat. We surface opportunities to mention mistakes, friction, and trade-offs.",
  },
];

const auditSteps = [
  "Running trust diagnostics...",
  "Analyzing empty language density...",
  "Scanning for LinkedIn clich茅s...",
  "Evaluating evidence markers...",
  "Generating authentic rewrites...",
  "Saving audit report...",
];

void FAQ_ITEMS;
void auditSteps;

const DISPLAY_FAQ_ITEMS = [
  {
    question: "Is this an AI detector?",
    answer: "No. PostTrust evaluates writing quality and trust patterns, not author origin. A human can write empty, cliche-heavy copy, and an AI can help produce specific, evidence-backed text. We highlight patterns that reduce professional credibility.",
  },
  {
    question: "Will you invent personal stories for me?",
    answer: "No. We do not fabricate stories or case studies. Authentic rewrites use bracketed placeholders like '[insert your team size]' or '[insert metric here]' where specific data points would strengthen your post.",
  },
  {
    question: "Do I need to connect my LinkedIn account?",
    answer: "No. PostTrust is a pre-publish editor. You paste your text, review the audit, copy the rewrite, and publish on LinkedIn yourself. No OAuth credentials required.",
  },
  {
    question: "What happens to my drafts?",
    answer: "Your in-progress draft stays in this browser until you submit it. Completed audits are saved to your account history so you can reopen them, and you can delete individual audit records from History.",
  },
  {
    question: "Can I use my credits on another device?",
    answer: "Yes. Your audit credits are bound to your verified email address, not to a single browser. Logging in on any device restores your balance.",
  },
  {
    question: "Does Article audit work the same way?",
    answer: "Article audit uses the same trust lens, but it also checks argument structure, section order, evidence density, transitions, and conclusion quality for long-form content.",
  },
];

const DISPLAY_AUDIT_STEPS = [
  "Running trust diagnostics...",
  "Analyzing empty language density...",
  "Scanning for LinkedIn cliches...",
  "Evaluating evidence markers...",
  "Generating authentic rewrites...",
  "Saving audit report...",
];

function isConfiguredPaymentLink(paymentUrl: string) {
  return /^https:\/\/buy\.stripe\.com\/.+/.test(paymentUrl) && !/\/test_[123](?:\?|$)/.test(paymentUrl);
}

function LandingContent({ user }: LandingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"post" | "article">("post");
  const [showOptions, setShowOptions] = useState(false);
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("Leads");
  const [tone, setTone] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Restore localStorage draft
  useEffect(() => {
    const cachedContent = localStorage.getItem("posttrust_draft_content");
    const cachedType = localStorage.getItem("posttrust_draft_type");
    const cachedAudience = localStorage.getItem("posttrust_draft_audience");
    const cachedGoal = localStorage.getItem("posttrust_draft_goal");

    if (cachedContent) setContent(cachedContent);
    if (cachedType === "post" || cachedType === "article") setContentType(cachedType);
    if (cachedAudience) setAudience(cachedAudience);
    if (cachedGoal) setGoal(cachedGoal);

    const hasSuccess = searchParams.get("login") === "success";
    if (hasSuccess && user && cachedContent && cachedContent.length >= 80) {
      router.replace("/");
      executeAudit(cachedContent, {
        type: (cachedType as "post" | "article") || "post",
        audience: cachedAudience || "",
        goal: cachedGoal || "Leads",
        tone,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  // Cycle loading steps
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAuditing) {
      interval = setInterval(() => {
        setAuditStep((prev) => (prev < DISPLAY_AUDIT_STEPS.length - 1 ? prev + 1 : prev));
      }, 2000);
    } else {
      setAuditStep(0);
    }
    return () => clearInterval(interval);
  }, [isAuditing]);

  const executeAudit = async (
    textToAudit: string,
    opts: { type: "post" | "article"; audience: string; goal: string; tone: boolean }
  ) => {
    setIsAuditing(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textToAudit,
          type: opts.type,
          audience: opts.audience,
          goal: opts.goal,
          tone: opts.tone,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 402) throw new Error("INSUFFICIENT_CREDITS");
        throw new Error(data.error || "Failed to process audit.");
      }
      localStorage.removeItem("posttrust_draft_content");
      router.push(`/audit/${data.auditId}`);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === "INSUFFICIENT_CREDITS") {
        setErrorMsg("You have run out of credits. Purchase a bundle below to continue.");
      } else {
        setErrorMsg(error.message || "An unexpected error occurred. Please try again.");
      }
      setIsAuditing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 80) return;
    localStorage.setItem("posttrust_draft_audience", audience);
    localStorage.setItem("posttrust_draft_goal", goal);
    localStorage.setItem("posttrust_draft_type", contentType);
    if (!user) {
      router.push("/sign-in");
      return;
    }
    executeAudit(content, { type: contentType, audience, goal, tone });
  };

  const handlePricingClick = (paymentUrl: string) => {
    if (!user) { router.push("/sign-in"); return; }
    if (!isConfiguredPaymentLink(paymentUrl)) {
      setErrorMsg("Checkout is not configured yet. Add the real Stripe Payment Link URL to NEXT_PUBLIC_STRIPE_LINK_* first.");
      document.getElementById("audit-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const sep = paymentUrl.includes("?") ? "&" : "?";
    window.location.href = `${paymentUrl}${sep}client_reference_id=${user.id}`;
  };

  const charCount = content.length;
  const maxCharacters = contentType === "article" ? 12000 : 3000;
  const isTooShort = charCount > 0 && charCount < 80;
  const isReady = charCount >= 80;

  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      <SiteHeader user={user} onSignIn={() => router.push("/sign-in")} />

      {/* 鈹€鈹€ Hero 鈹€鈹€ */}
      <section className="w-full pt-20 pb-16 text-center animate-fadeUp">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#176B4D] bg-[#176B4D]/10 border border-[#176B4D]/20 px-3 py-1 rounded-full mb-7">
          <Sparkles className="h-3 w-3" />
          LinkedIn AI Slop Audit
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#171A18] tracking-tight leading-[1.1] max-w-3xl mx-auto mb-6">
          Make your LinkedIn post sound{" "}
          <span className="text-[#176B4D]">experienced</span>,{" "}
          not AI-generated.
        </h1>

        <p className="text-lg md:text-xl text-[#171A18]/60 max-w-2xl mx-auto leading-relaxed mb-10">
          Paste a draft. PostTrust finds vague claims, recycled cliches, fake-expert signals, and missing evidence, then shows you how to make it sound like <em>you</em>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#171A18]/50">
          {["No credit card to start", "First audit free", "No LinkedIn login needed"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-[#176B4D]" />
              {t}
            </span>
          ))}
        </div>
        </div>
      </section>

      {/* 鈹€鈹€ Audit Editor 鈹€鈹€ */}
      <section id="audit-editor" className="w-full pb-24">
        <div className="max-w-3xl mx-auto px-6 md:px-10">

        {errorMsg && (
          <div className="mb-4 bg-[#B5473C]/8 border border-[#B5473C]/20 text-[#B5473C] rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Audit failed</p>
              <p className="text-xs mt-0.5 opacity-80">{errorMsg}</p>
            </div>
          </div>
        )}

        {isAuditing ? (
          <div className="bg-white border border-[#171A18]/10 rounded-2xl shadow-sm p-16 text-center flex flex-col items-center justify-center min-h-[380px] space-y-5">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-[#176B4D]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#171A18]">Analyzing your post</h3>
              <p className="text-sm text-[#171A18]/50 font-mono animate-pulse">{DISPLAY_AUDIT_STEPS[auditStep]}</p>
            </div>
            <p className="text-xs text-[#171A18]/35 max-w-xs">This usually finishes in under a minute. Checking claims, evidence, structure, and voice.</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#171A18]/10 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Type Switcher */}
            <div className="flex gap-1 p-3 bg-[#F7F8F6] border-b border-[#171A18]/8">
              {(["post", "article"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setContentType(type); localStorage.setItem("posttrust_draft_type", type); }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    contentType === type
                      ? "bg-white shadow-sm border border-[#171A18]/10 text-[#176B4D]"
                      : "text-[#171A18]/55 hover:text-[#171A18]"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {type === "post" ? "Post Draft" : (
                    <span className="flex items-center gap-1.5">
                      Article
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="px-5 pt-5 pb-3">
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  localStorage.setItem("posttrust_draft_content", e.target.value);
                }}
                placeholder={
                  contentType === "post"
                    ? "Paste your LinkedIn post draft here..."
                    : "Paste your LinkedIn article draft here..."
                }
                maxLength={maxCharacters}
                className="w-full min-h-[260px] border-0 outline-none focus:ring-0 text-[15px] text-[#171A18] placeholder-[#171A18]/30 leading-relaxed font-sans resize-y bg-transparent"
              />
              <div className="flex justify-between items-center text-xs text-[#171A18]/40 pt-3 border-t border-[#171A18]/5 font-mono mt-1">
                <span>
                  {isTooShort && (
                    <span className="text-[#B5473C] font-semibold">Needs {80 - charCount} more characters</span>
                  )}
                </span>
                <span className={charCount > maxCharacters * 0.93 ? "text-[#B5473C]" : ""}>{charCount.toLocaleString()} / {maxCharacters.toLocaleString()}</span>
              </div>
            </div>

            {/* Options Accordion */}
            <div className="border-t border-[#171A18]/8">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-[#171A18]/55 hover:text-[#171A18] transition-colors cursor-pointer select-none"
              >
                <span>Context Options: Target Audience, Goal & Tone</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showOptions ? "rotate-180" : ""}`} />
              </button>

              {showOptions && (
                <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#171A18]/5 pt-4 animate-slideDown">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#171A18]/60 block uppercase tracking-wide">Who is this for?</label>
                    <input
                      type="text"
                      value={audience}
                      onChange={(e) => { setAudience(e.target.value); localStorage.setItem("posttrust_draft_audience", e.target.value); }}
                      placeholder="e.g. B2B SaaS Founders, Consultants"
                      className="w-full px-3 py-2 bg-[#F7F8F6] border border-[#171A18]/10 rounded-lg text-sm text-[#171A18] focus:outline-none focus:ring-2 focus:ring-[#176B4D]/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#171A18]/60 block uppercase tracking-wide">Post goal</label>
                    <select
                      value={goal}
                      onChange={(e) => { setGoal(e.target.value); localStorage.setItem("posttrust_draft_goal", e.target.value); }}
                      className="w-full px-3 py-2 bg-[#F7F8F6] border border-[#171A18]/10 rounded-lg text-sm text-[#171A18] focus:outline-none focus:ring-2 focus:ring-[#176B4D]/30"
                    >
                      <option value="Leads">Generate Client Leads / Consults</option>
                      <option value="Awareness">Increase Awareness / Share Opinion</option>
                      <option value="Hiring">Hiring / Team Growth</option>
                      <option value="Launch">Product / Feature Launch</option>
                      <option value="Conversation">Start an Industry Conversation</option>
                    </select>
                  </div>
                  <label className="md:col-span-2 flex items-center gap-2.5 cursor-pointer">
                    <input
                      id="tone-checkbox"
                      type="checkbox"
                      checked={tone}
                      onChange={(e) => setTone(e.target.checked)}
                      className="h-4 w-4 rounded border-[#171A18]/25 text-[#176B4D] accent-[#176B4D] cursor-pointer"
                    />
                    <span className="text-xs text-[#171A18]/65">Preserve original voice & tone in rewrites</span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="border-t border-[#171A18]/8 px-5 py-4 bg-[#F7F8F6]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#171A18]/50 text-center sm:text-left">
                First audit is free. No credit card required.
              </span>
              <button
                type="submit"
                disabled={!isReady}
                className="w-full sm:w-auto h-11 px-7 bg-[#176B4D] hover:bg-[#0F4D36] disabled:bg-[#176B4D]/35 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
              >
                Audit my post
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
        </div>
      </section>

      {/* 鈹€鈹€ How It Works / Demo 鈹€鈹€ */}
      <section id="how-it-works" className="border-t border-[#171A18]/8 bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-10 space-y-12">
          <div className="text-center space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#176B4D]">Interactive Demo</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#171A18] tracking-tight">See exactly what you get</h2>
            <p className="text-base text-[#171A18]/55 max-w-xl mx-auto">
              Click any highlighted sentence to explore the diagnostics panel. Then switch to the humanized revision.
            </p>
          </div>
          <DemoAudit />
        </div>
      </section>

      {/* 鈹€鈹€ What We Audit For 鈹€鈹€ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-10 space-y-12">
          <div className="text-center space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#176B4D]">Detection Engine</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#171A18] tracking-tight">What we audit for</h2>
            <p className="text-base text-[#171A18]/55 max-w-xl mx-auto">
              Six signals that can weaken reader trust on LinkedIn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 stagger">
            {AUDIT_DIMENSIONS.map(({ label, color, desc }) => {
              const tagClass =
                color === "risk"
                  ? "text-[#B5473C] bg-[#B5473C]/8 border-[#B5473C]/15"
                  : color === "warning"
                  ? "text-[#B7791F] bg-[#B7791F]/8 border-[#B7791F]/15"
                  : "text-[#176B4D] bg-[#176B4D]/8 border-[#176B4D]/15";
              return (
                <div
                  key={label}
                  className="bg-white border border-[#171A18]/8 rounded-xl p-6 space-y-3 card-hover animate-fadeUp"
                >
                  <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded border ${tagClass}`}>
                    {label}
                  </span>
                  <p className="text-sm text-[#171A18]/70 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 鈹€鈹€ Pricing 鈹€鈹€ */}
      <section id="pricing" className="border-t border-[#171A18]/8 bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-10 space-y-12">
          <div className="text-center space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#176B4D]">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#171A18] tracking-tight">Simple, transparent plans</h2>
            <p className="text-base text-[#171A18]/55">Start with a one-time pack. Monthly billing is optional and managed through Stripe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Fix */}
            <div className="bg-[#F7F8F6] border border-[#171A18]/10 rounded-2xl p-7 flex flex-col justify-between card-hover">
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#171A18]/40 mb-1">One-time</p>
                  <h3 className="text-xl font-bold text-[#171A18]">Quick Fix</h3>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#171A18]">$9</span>
                  <span className="text-sm text-[#171A18]/50">one-time</span>
                </div>
                <p className="text-sm text-[#171A18]/65 leading-relaxed">
                  Fix the posts you need to publish this week. Perfect for testing the core flow.
                </p>
                <hr className="border-[#171A18]/8" />
                <ul className="text-sm space-y-2.5 text-[#171A18]/70">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-[#176B4D] shrink-0" />
                    3 Full Audits &amp; Rewrites
                  </li>
                  <li className="flex items-center gap-2.5 opacity-50">
                    <Zap className="h-4 w-4 shrink-0" />
                    No custom style guide
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handlePricingClick(process.env.NEXT_PUBLIC_STRIPE_LINK_QUICK_FIX || "")}
                className="mt-8 w-full py-3 bg-[#171A18] hover:bg-black text-white text-sm font-bold rounded-xl cursor-pointer transition-colors"
              >
                Get 3 audits
              </button>
            </div>

            {/* Voice Audit 鈥?Featured */}
            <div className="bg-[#176B4D] rounded-2xl p-7 flex flex-col justify-between relative shadow-xl shadow-[#176B4D]/20 card-hover">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-[#176B4D] text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-[#176B4D]/20 shadow-sm">
                Voice Profile
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">One-time</p>
                  <h3 className="text-xl font-bold text-white">Voice Profile Pack</h3>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-white">$29</span>
                  <span className="text-sm text-white/50">one-time</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  Build one reusable voice profile from 3-5 of your own posts and use it in future audits.
                </p>
                <hr className="border-white/15" />
                <ul className="text-sm space-y-2.5 text-white/80">
                  <li className="flex items-center gap-2.5 text-white font-medium">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    10 Audits &amp; Rewrites
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    1 Personal Voice Profile per email
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handlePricingClick(process.env.NEXT_PUBLIC_STRIPE_LINK_VOICE_AUDIT || "")}
                className="mt-8 w-full py-3 bg-white text-[#176B4D] text-sm font-extrabold rounded-xl cursor-pointer transition-colors hover:bg-[#F7F8F6]"
              >
                Build my voice profile
              </button>
            </div>

            {/* Monthly */}
            <div className="bg-[#F7F8F6] border border-[#171A18]/10 rounded-2xl p-7 flex flex-col justify-between card-hover">
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#171A18]/40 mb-1">Subscription</p>
                  <h3 className="text-xl font-bold text-[#171A18]">Monthly Audit</h3>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#171A18]">$49</span>
                  <span className="text-sm text-[#171A18]/50">/&nbsp;month</span>
                </div>
                <p className="text-sm text-[#171A18]/65 leading-relaxed">
                  A pre-publish check for every working week. Keeps content consistently authentic.
                </p>
                <hr className="border-[#171A18]/8" />
                <ul className="text-sm space-y-2.5 text-[#171A18]/70">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-[#176B4D] shrink-0" />
                    30 Audits per billing period
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-[#176B4D] shrink-0" />
                    Voice Profile integration
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handlePricingClick(process.env.NEXT_PUBLIC_STRIPE_LINK_MONTHLY_AUDIT || "")}
                className="mt-8 w-full py-3 bg-[#171A18] hover:bg-black text-white text-sm font-bold rounded-xl cursor-pointer transition-colors"
              >
                Start monthly audits
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 鈹€鈹€ FAQ 鈹€鈹€ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-6 md:px-10 space-y-10">
          <div className="text-center space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#176B4D]">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#171A18] tracking-tight">Frequently asked questions</h2>
            <p className="text-base text-[#171A18]/55">Everything about audits, security, and payments.</p>
          </div>

          <div className="border border-[#171A18]/10 rounded-2xl bg-white overflow-hidden divide-y divide-[#171A18]/8">
            {DISPLAY_FAQ_ITEMS.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx}>
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between font-semibold text-[#171A18] text-sm hover:bg-[#F7F8F6] transition-colors cursor-pointer"
                  >
                    <span>{item.question}</span>
                    <ChevronRight className={`h-4 w-4 shrink-0 text-[#176B4D]/60 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm text-[#171A18]/65 leading-relaxed bg-[#F7F8F6]/40 animate-slideDown">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 鈹€鈹€ Final CTA Banner 鈹€鈹€ */}
      <section className="border-t border-[#171A18]/8 bg-white py-20">
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#171A18] tracking-tight leading-tight">
            Your next post should sound like you,<br className="hidden sm:block" /> not a prompt template.
          </h2>
          <p className="text-base text-[#171A18]/55">Free to try. No credit card. Usually under a minute.</p>
          <a
            href="#audit-editor"
            className="inline-flex items-center gap-2 h-12 px-8 bg-[#176B4D] hover:bg-[#0F4D36] text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:shadow-lg cursor-pointer"
          >
            Audit your post now
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* 鈹€鈹€ Footer 鈹€鈹€ */}
      <footer className="hidden">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[#176B4D]" />
          <span>漏 {new Date().getFullYear()} PostTrust. All rights reserved.</span>
        </div>
        <div className="flex gap-5">
          <a href="#" className="hover:text-[#171A18] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#171A18] transition-colors">Terms</a>
          <a href="mailto:support@posttrust.com" className="hover:text-[#171A18] transition-colors">Support</a>
        </div>
      </footer>

      <SiteFooter />

    </div>
  );
}

export default function LandingClient({ user }: LandingClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F8F6] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#176B4D] flex items-center justify-center">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-[#176B4D]" />
        <span className="text-sm font-medium text-[#171A18]/50">Loading PostTrust...</span>
      </div>
    }>
      <LandingContent user={user} />
    </Suspense>
  );
}

