"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import type { VoiceProfile } from "@/lib/voice-profile";

export default function VoiceProfileClient({ enabled }: { enabled: boolean }) {
  const [posts, setPosts] = useState(["", "", ""]);
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    fetch("/api/voice-profile")
      .then((response) => response.json())
      .then((data) => setProfile(data.profile ?? null))
      .catch(() => setError("Could not load your Voice Profile."))
      .finally(() => setLoading(false));
  }, [enabled]);

  const updatePost = (index: number, value: string) => {
    setPosts((current) => current.map((post, postIndex) => (postIndex === index ? value : post)));
  };

  const generate = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/voice-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not generate Voice Profile.");
      setProfile(data.profile);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Could not generate Voice Profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!enabled) {
    return (
        <div className="mx-auto max-w-2xl border border-[#171A18]/10 bg-white p-8">
          <p className="text-xs font-bold uppercase text-[#176B4D]">Voice Profile</p>
          <h1 className="mt-3 text-3xl font-bold">Make every rewrite sound like you</h1>
          <p className="mt-4 text-[#171A18]/65">The Voice Profile Pack unlocks one reusable profile built from 3-5 posts you wrote yourself.</p>
          <Link href="/#pricing" className="mt-6 inline-flex bg-[#176B4D] px-5 py-3 text-sm font-semibold text-white">View Voice Profile Pack</Link>
        </div>
    );
  }

  return (
      <div>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <p className="text-xs font-bold uppercase text-[#176B4D]">Your writing samples</p>
            <h1 className="mt-2 text-3xl font-bold">Build your Voice Profile</h1>
            <p className="mt-3 text-sm text-[#171A18]/60">Paste 3-5 posts you wrote without AI assistance. Regenerating replaces your existing profile.</p>
            <div className="mt-6 space-y-4">
              {posts.map((post, index) => (
                <div key={index} className="border border-[#171A18]/10 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#171A18]/50">
                    <span>Sample {index + 1}</span>
                    {posts.length > 3 && <button type="button" onClick={() => setPosts((current) => current.filter((_, i) => i !== index))} aria-label={`Remove sample ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}
                  </div>
                  <textarea value={post} onChange={(event) => updatePost(index, event.target.value)} maxLength={3000} className="min-h-36 w-full resize-y bg-transparent text-sm outline-none" placeholder="Paste a post you wrote..." />
                  <p className="text-right text-xs text-[#171A18]/40">{post.length}/3,000</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {posts.length < 5 && <button type="button" onClick={() => setPosts((current) => [...current, ""])} className="inline-flex items-center gap-2 border border-[#171A18]/15 bg-white px-4 py-2 text-sm"><Plus className="h-4 w-4" />Add sample</button>}
              <button type="button" onClick={generate} disabled={saving || posts.some((post) => post.trim().length < 80)} className="inline-flex items-center gap-2 bg-[#176B4D] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{profile ? "Regenerate profile" : "Generate profile"}</button>
            </div>
            {error && <p className="mt-4 text-sm text-[#B5473C]" role="alert">{error}</p>}
          </section>

          <aside className="h-fit border border-[#171A18]/10 bg-white p-6 lg:sticky lg:top-8">
            <h2 className="text-lg font-bold">Current profile</h2>
            {loading ? <Loader2 className="mt-6 h-5 w-5 animate-spin text-[#176B4D]" /> : profile ? (
              <div className="mt-5 space-y-5 text-sm">
                <p className="leading-relaxed text-[#171A18]/70">{profile.summary}</p>
                {[['Tone', profile.toneTraits], ['Rhythm', profile.rhythmRules], ['Evidence', profile.evidenceHabits], ['Structure', profile.structurePatterns], ['Avoid', profile.phrasesToAvoid]].map(([label, items]) => (
                  <div key={label as string}><h3 className="font-semibold">{label as string}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-[#171A18]/60">{(items as string[]).map((item) => <li key={item}>{item}</li>)}</ul></div>
                ))}
              </div>
            ) : <p className="mt-4 text-sm text-[#171A18]/50">Your generated style rules will appear here.</p>}
          </aside>
        </div>
      </div>
  );
}
