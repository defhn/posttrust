"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, FileText, Trash2 } from "lucide-react";

interface HistoryItem {
  id: string;
  createdAt: string;
  type: "post" | "article";
  score: number | null;
  verdict: string;
  excerpt: string;
}

export default function HistoryList({ initialItems }: { initialItems: HistoryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (item: HistoryItem) => {
    if (!window.confirm("Delete this audit result? This cannot be undone.")) return;
    setDeletingId(item.id);
    const response = await fetch(`/api/audits/${item.id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    setDeletingId(null);
  };

  if (items.length === 0) {
    return <div className="mt-10 border border-dashed border-[#171A18]/20 bg-white px-6 py-16 text-center text-sm text-[#171A18]/55">No audits yet. Your first completed audit will appear here.</div>;
  }

  return (
    <div className="mt-8 divide-y divide-[#171A18]/10 border border-[#171A18]/10 bg-white">
      {items.map((item) => (
        <article key={item.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#171A18]/45">
              <span className="inline-flex items-center gap-1 font-semibold uppercase text-[#176B4D]"><FileText className="h-3.5 w-3.5" />{item.type}</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              {item.score !== null && <span>Risk score {item.score}/100</span>}
            </div>
            <p className="mt-2 font-semibold text-[#171A18]">{item.verdict}</p>
            <p className="mt-1 truncate text-sm text-[#171A18]/55">{item.excerpt}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/audit/${item.id}`} className="inline-flex h-10 items-center gap-2 border border-[#171A18]/15 px-3 text-sm font-semibold">Open<ArrowUpRight className="h-4 w-4" /></Link>
            <button type="button" onClick={() => remove(item)} disabled={deletingId === item.id} className="inline-flex h-10 w-10 items-center justify-center border border-[#171A18]/15 text-[#B5473C] disabled:opacity-40" aria-label="Delete audit"><Trash2 className="h-4 w-4" /></button>
          </div>
        </article>
      ))}
    </div>
  );
}
