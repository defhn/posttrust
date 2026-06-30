"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, ArrowRight, CornerDownRight, RotateCcw } from "lucide-react";

interface Annotation {
  id: string;
  snippet: string;
  category: string;
  risk: string;
  suggestion: string;
  colorClass: string;
  bgColorClass: string;
}

const mockAnnotations: Annotation[] = [
  {
    id: "ann_1",
    snippet: "Success isn't about working harder. It's about working smarter and embracing the journey.",
    category: "Empty Language / Platitude",
    risk: "This is a generic business lesson that says nothing testable. Over-generalizing makes you sound like an automated writing template rather than an active practitioner.",
    suggestion: "Delete the universal lecture. Tell the reader exactly what specific action you took, what it cost, and the result.",
    colorClass: "border-[#B5473C] text-[#B5473C]",
    bgColorClass: "bg-[#B5473C]/10 hover:bg-[#B5473C]/15",
  },
  {
    id: "ann_2",
    snippet: "AI is completely disrupting how modern founders build startups in 2026.",
    category: "Fake-Expert Tone",
    risk: "Declarations that sound like industry summaries lack personal authority and evidence. Readers glide past large proclamations.",
    suggestion: "Narrow your scope. Instead of explaining 'disruption' for everyone, describe how your team specifically adopted AI this week.",
    colorClass: "border-[#B7791F] text-[#B7791F]",
    bgColorClass: "bg-[#B7791F]/10 hover:bg-[#B7791F]/15",
  },
  {
    id: "ann_3",
    snippet: "Let that sink in. Agree?",
    category: "LinkedIn Cliché",
    risk: "Forced dramatic pauses and shallow call-to-actions are hallmarks of engagement farming. They create negative friction for buyers.",
    suggestion: "End with an open, specific question relevant to your service, or skip the call-out altogether.",
    colorClass: "border-[#B5473C] text-[#B5473C]",
    bgColorClass: "bg-[#B5473C]/10 hover:bg-[#B5473C]/15",
  },
];

const originalText = `AI is completely disrupting how modern founders build startups in 2026. 

After running our SaaS team for three years, I've realized one major truth: 

Success isn't about working harder. It's about working smarter and embracing the journey. 

We automated our entire lead pipeline this month, saving 15 hours per client. 

Let that sink in. Agree?`;

const humanizedText = `We replaced our manual spreadsheet routing with a simple webhook that alerts our account managers when a lead visits our docs.

It took 3 hours to configure and saves our team about 15 hours of manual follow-up every single week.

Instead of writing grand strategies about automation, we focused on fixing the one friction point that was actually dragging our onboarding speed down.`;

export default function DemoAudit() {
  const [activeAnnId, setActiveAnnId] = useState<string | null>("ann_1");
  const [showRewrite, setShowRewrite] = useState(false);

  const activeAnn = mockAnnotations.find((a) => a.id === activeAnnId);

  const renderAnnotatedText = () => {
    const parts: React.ReactNode[] = [];
    
    // We sort annotations by their occurrence to replace them sequentially
    const sortedAnns = [...mockAnnotations].sort(
      (a, b) => originalText.indexOf(a.snippet) - originalText.indexOf(b.snippet)
    );

    let lastIndex = 0;

    sortedAnns.forEach((ann, index) => {
      const startPos = originalText.indexOf(ann.snippet);
      if (startPos === -1) return;

      // Add text before highlight
      if (startPos > lastIndex) {
        parts.push(
          <span key={`text_${index}`} className="whitespace-pre-line text-[#171A18]/80">
            {originalText.substring(lastIndex, startPos)}
          </span>
        );
      }

      // Add highlight
      const isActive = activeAnnId === ann.id;
      parts.push(
        <button
          key={`ann_${ann.id}`}
          onClick={() => {
            setActiveAnnId(ann.id);
            setShowRewrite(false);
          }}
          className={`inline transition-all border-b-2 cursor-pointer rounded-sm px-1 py-0.5 font-sans font-medium text-left ${ann.bgColorClass} ${
            isActive ? `${ann.colorClass} border-solid font-semibold ring-1 ring-offset-1 ring-current` : "border-dashed border-current"
          }`}
          title="Click to view audit feedback"
        >
          {ann.snippet}
        </button>
      );

      lastIndex = startPos + ann.snippet.length;
    });

    // Add trailing text
    if (lastIndex < originalText.length) {
      parts.push(
        <span key="text_tail" className="whitespace-pre-line text-[#171A18]/80">
          {originalText.substring(lastIndex)}
        </span>
      );
    }

    // Wrap in stable container to prevent browser extension DOM mutation errors
    return (
      <div suppressHydrationWarning className="leading-relaxed font-sans">
        {parts}
      </div>
    );
  };

  return (
    <div className="w-full bg-white border border-[#171A18]/10 rounded-lg shadow-sm overflow-hidden">
      {/* Widget Tabs */}
      <div className="flex border-b border-[#171A18]/10 bg-[#F7F8F6]">
        <button
          onClick={() => setShowRewrite(false)}
          className={`flex-1 py-3 text-sm font-medium border-r border-[#171A18]/10 text-center cursor-pointer transition-colors ${
            !showRewrite ? "bg-white text-[#176B4D] font-semibold" : "text-[#171A18]/70 hover:text-[#171A18]"
          }`}
        >
          Interactive Diagnostic Draft
        </button>
        <button
          onClick={() => {
            setShowRewrite(true);
            setActiveAnnId(null);
          }}
          className={`flex-1 py-3 text-sm font-medium text-center cursor-pointer transition-colors ${
            showRewrite ? "bg-white text-[#176B4D] font-semibold" : "text-[#171A18]/70 hover:text-[#171A18]"
          }`}
        >
          Humanized Revision
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#171A18]/10 min-h-[340px]">
        {/* Content Box */}
        <div className="md:col-span-7 p-6 font-mono text-sm leading-relaxed">
          {showRewrite ? (
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-sans text-[#176B4D] bg-[#176B4D]/10 rounded px-2.5 py-1 w-fit font-medium">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Authentic Rewrite (Zero AI Slop)
                </div>
                <div className="text-[#171A18] whitespace-pre-line font-sans pl-1">
                  {humanizedText}
                </div>
              </div>
              <button
                onClick={() => setShowRewrite(false)}
                className="mt-6 text-xs text-[#176B4D] font-sans font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Back to Diagnostics
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-sans text-[#B5473C] bg-[#B5473C]/10 rounded px-2.5 py-1 w-fit font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Trust Score: 22/100 (Low Trust)
              </div>
              <div className="font-sans leading-relaxed">
                {renderAnnotatedText()}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Inspector */}
        <div className="md:col-span-5 p-6 bg-[#F7F8F6]/40 flex flex-col justify-between font-sans">
          {activeAnn ? (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#171A18]/50 block mb-1">
                  Trust Risk Category
                </span>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border border-current ${
                  activeAnn.id === "ann_2" ? "text-[#B7791F] bg-[#B7791F]/5" : "text-[#B5473C] bg-[#B5473C]/5"
                }`}>
                  {activeAnn.category}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#171A18]/50 block mb-1">
                  Why this hurts trust
                </span>
                <p className="text-xs text-[#171A18] leading-relaxed">
                  {activeAnn.risk}
                </p>
              </div>

              <div className="bg-white border border-[#171A18]/10 rounded p-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#176B4D] flex items-center gap-1 mb-1.5 font-semibold">
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Actionable Revision Advice
                </span>
                <p className="text-xs text-[#171A18]/90 leading-relaxed font-sans">
                  {activeAnn.suggestion}
                </p>
              </div>
            </div>
          ) : showRewrite ? (
            <div className="h-full flex flex-col justify-center text-center py-6 space-y-3">
              <span className="text-xs font-semibold text-[#176B4D]">
                Why this revision works:
              </span>
              <p className="text-xs text-[#171A18]/80 leading-relaxed max-w-xs mx-auto">
                Instead of making general platitudes, this revision focuses on a specific problem (spreadsheet routing), the action taken, and concrete metrics. The tone is descriptive rather than lecturing.
              </p>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-[#171A18]/50 py-8">
              Click a highlighted sentence to review the diagnostic advice.
            </div>
          )}

          {activeAnn && (
            <button
              onClick={() => {
                setShowRewrite(true);
                setActiveAnnId(null);
              }}
              className="mt-6 flex items-center justify-between bg-[#176B4D] hover:bg-[#12533B] text-white text-xs font-semibold px-4 py-2.5 rounded transition-all cursor-pointer shadow-sm"
            >
              See Humanized Rewrite
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
