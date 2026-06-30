import { NextResponse } from "next/server";
import { getCurrentUser, getUserCredits } from "@/lib/auth";
import { runSlopAudit } from "@/lib/gemini";
import { db } from "@/db";
import { creditLedger, audits, voiceProfiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auditRequestSchema } from "@/lib/audit-input";
import { formatVoiceProfileForPrompt, voiceProfileSchema } from "@/lib/voice-profile";

export async function POST(req: Request) {
  try {
    // 1. Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to audit your post." },
        { status: 401 }
      );
    }

    // 2. Parse request payload
    const json = await req.json();
    const result = auditRequestSchema.safeParse(json);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid audit parameters";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { content, type, audience, goal, tone } = result.data;
    const auditId = `aud_${crypto.randomUUID().replace(/-/g, "")}`;
    const options = { type, audience, goal, tone };

    if ((await getUserCredits(user.id)) < 1) {
      return NextResponse.json(
        { error: "Insufficient credits. Please purchase more audits." },
        { status: 402 },
      );
    }

    const [voiceRecord] = await db
      .select({ profile: voiceProfiles.profile })
      .from(voiceProfiles)
      .where(eq(voiceProfiles.userId, user.id))
      .limit(1);

    const voiceProfile = voiceRecord
      ? formatVoiceProfileForPrompt(voiceProfileSchema.parse(JSON.parse(voiceRecord.profile)))
      : undefined;

    // 3. Execute audit via Gemini API (do it outside transaction to avoid holding locks during network request)
    let auditResult;
    try {
      auditResult = await runSlopAudit(content, { ...options, voiceProfile });
    } catch (apiError: unknown) {
      const err = apiError as Error;
      console.error("Gemini API call failed:", err);
      return NextResponse.json(
        { error: err.message || "Failed to process audit. Gemini API is temporarily unavailable." },
        { status: 502 }
      );
    }

    // 4. Perform ledger check and write transaction
    try {
      await db.transaction(async (tx) => {
        // Fetch current credits within transaction
        const creditsResult = await tx
          .select({
            balance: sql<number>`COALESCE(SUM(${creditLedger.delta}), 0)::integer`,
          })
          .from(creditLedger)
          .where(eq(creditLedger.userId, user.id));

        const balance = creditsResult[0]?.balance ?? 0;

        if (balance < 1) {
          throw new Error("INSUFFICIENT_CREDITS");
        }

        // Deduct 1 credit
        const ledgerId = `crd_${crypto.randomUUID().replace(/-/g, "")}`;
        await tx.insert(creditLedger).values({
          id: ledgerId,
          userId: user.id,
          delta: -1,
          reason: "audit_cost",
        });

        // Insert audit log
        await tx.insert(audits).values({
          id: auditId,
          userId: user.id,
          input: content,
          options: JSON.stringify(options),
          result: JSON.stringify(auditResult),
          creditCost: 1,
        });
      });
    } catch (txError: unknown) {
      const err = txError as Error;
      if (err.message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          { error: "Insufficient credits. Please purchase more audits." },
          { status: 402 }
        );
      }
      throw txError;
    }

    return NextResponse.json({ success: true, auditId });
  } catch (error) {
    console.error("Audit endpoint error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during the audit." },
      { status: 500 }
    );
  }
}
