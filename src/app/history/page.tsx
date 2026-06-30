import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import HistoryList from "@/components/history-list";
import { db } from "@/db";
import { audits } from "@/db/schema";
import { createAuditSummary } from "@/lib/audit-history";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/?signin=required");

  const records = await db
    .select()
    .from(audits)
    .where(eq(audits.userId, user.id))
    .orderBy(desc(audits.createdAt))
    .limit(50);

  const items = records.map((record) => ({
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    ...createAuditSummary(record),
  }));

  return (
    <main className="min-h-screen bg-[#F7F8F6] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-[#176B4D]">Your workspace</p>
            <h1 className="mt-2 text-3xl font-bold">Audit history</h1>
            <p className="mt-2 text-sm text-[#171A18]/55">Your 50 most recent Post and Article audits.</p>
          </div>
          <Link href="/" className="bg-[#176B4D] px-4 py-2 text-sm font-semibold text-white">New audit</Link>
        </div>
        <HistoryList initialItems={items} />
      </div>
    </main>
  );
}
