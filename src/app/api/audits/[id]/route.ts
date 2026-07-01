import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { audits, voiceProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { rebuildAuditRequestSchema } from "@/lib/audit-rebuild";
import { auditResultSchema, rebuildAuthenticRewrite } from "@/lib/gemini";
import { formatVoiceProfileForPrompt, voiceProfileSchema } from "@/lib/voice-profile";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
  const parsedRequest = rebuildAuditRequestSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: parsedRequest.error.issues[0]?.message || "Invalid evidence answers" },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const [audit] = await db
    .select()
    .from(audits)
    .where(and(eq(audits.id, id), eq(audits.userId, user.id)))
    .limit(1);

  if (!audit) return NextResponse.json({ error: "Audit not found" }, { status: 404 });

  try {
    const storedResult = auditResultSchema.parse(JSON.parse(audit.result));
    if (storedResult.rebuild) {
      return NextResponse.json(
        { error: "This audit already includes its final evidence-based rewrite." },
        { status: 409 },
      );
    }

    const availableQuestions = new Set(storedResult.missingContextDetails.slice(0, 5));
    const answers = parsedRequest.data.answers.filter(({ question }) => availableQuestions.has(question));
    if (answers.length !== parsedRequest.data.answers.length) {
      return NextResponse.json({ error: "One or more evidence questions are invalid." }, { status: 400 });
    }

    const options = JSON.parse(audit.options) as {
      type: "post" | "article";
      audience?: string;
      goal?: string;
      tone?: boolean;
    };
    const [voiceRecord] = await db
      .select({ profile: voiceProfiles.profile })
      .from(voiceProfiles)
      .where(eq(voiceProfiles.userId, user.id))
      .limit(1);
    const voiceProfile = voiceRecord
      ? formatVoiceProfileForPrompt(voiceProfileSchema.parse(JSON.parse(voiceRecord.profile)))
      : undefined;

    const authentic = await rebuildAuthenticRewrite({
      text: audit.input,
      originalRewrite: storedResult.rewrites.authentic,
      answers,
      options,
      voiceProfile,
    });
    const updatedResult = {
      ...storedResult,
      rewrites: { ...storedResult.rewrites, authentic },
      rebuild: { generatedAt: new Date().toISOString(), answerCount: answers.length },
    };
    const updated = await db
      .update(audits)
      .set({ result: JSON.stringify(updatedResult) })
      .where(and(eq(audits.id, id), eq(audits.userId, user.id), eq(audits.result, audit.result)))
      .returning({ id: audits.id });

    if (updated.length === 0) {
      return NextResponse.json({ error: "This audit was already rebuilt." }, { status: 409 });
    }

    return NextResponse.json({ authentic, rebuild: updatedResult.rebuild });
  } catch (error) {
    console.error("Audit rebuild failed", error);
    const message = error instanceof Error && error.message.startsWith("The final rewrite")
      ? error.message
      : "Could not rebuild this rewrite. Please try again.";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const deleted = await db
    .delete(audits)
    .where(and(eq(audits.id, id), eq(audits.userId, user.id)))
    .returning({ id: audits.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
