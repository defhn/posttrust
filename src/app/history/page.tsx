import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell";
import HistoryList from "@/components/history-list";
import { db } from "@/db";
import { audits } from "@/db/schema";
import { createAuditSummary } from "@/lib/audit-history";
import { getCurrentUser, getUserCredits } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const credits = await getUserCredits(user.id);

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

  const shellUser = {
    id: user.id,
    email: user.email,
    credits,
    hasVoiceProfile: Boolean(user.voiceProfileEnabledAt),
    hasBilling: Boolean(user.stripeCustomerId),
    subscriptionStatus: user.subscriptionStatus,
  };

  return (
    <AppShell
      user={shellUser}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "History" },
      ]}
      actions={<Link href="/" className="bg-[#176B4D] px-4 py-2 text-sm font-semibold text-white">New audit</Link>}
    >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-[#176B4D]">Your workspace</p>
            <h1 className="mt-2 text-3xl font-bold">Audit history</h1>
            <p className="mt-2 text-sm text-[#171A18]/55">Your 50 most recent Post and Article audits.</p>
          </div>
        </div>
        <HistoryList initialItems={items} />
    </AppShell>
  );
}
