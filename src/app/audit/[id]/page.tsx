import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getUserCredits } from "@/lib/auth";
import { db } from "@/db";
import { audits } from "@/db/schema";
import { eq } from "drizzle-orm";
import AuditResultClient from "@/components/audit-result-client";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditResultPage({ params }: AuditPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?error=auth_required");
  }

  // Fetch the audit record from database
  const auditResult = await db
    .select()
    .from(audits)
    .where(eq(audits.id, id))
    .limit(1);

  if (auditResult.length === 0) {
    notFound();
  }

  const audit = auditResult[0];

  // Verify ownership
  if (audit.userId !== user.id) {
    redirect("/?error=unauthorized_audit_view");
  }

  const credits = await getUserCredits(user.id);

  let optionsObj;
  let resultObj;

  try {
    optionsObj = JSON.parse(audit.options);
    resultObj = JSON.parse(audit.result);
  } catch (err) {
    console.error("Failed to parse JSON columns for audit record", audit.id, err);
    notFound();
  }

  const clientUser = {
    id: user.id,
    email: user.email,
    credits,
  };

  return (
    <AuditResultClient
      auditId={audit.id}
      input={audit.input}
      options={optionsObj}
      result={resultObj}
      user={clientUser}
    />
  );
}
