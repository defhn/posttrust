import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { voiceProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { generateVoiceProfile } from "@/lib/gemini";
import { voiceProfileInputSchema, voiceProfileSchema } from "@/lib/voice-profile";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [record] = await db
    .select()
    .from(voiceProfiles)
    .where(eq(voiceProfiles.userId, user.id))
    .limit(1);

  return NextResponse.json({
    enabled: Boolean(user.voiceProfileEnabledAt),
    profile: record ? voiceProfileSchema.parse(JSON.parse(record.profile)) : null,
    sourceCount: record ? (JSON.parse(record.sourcePosts) as string[]).length : 0,
    updatedAt: record?.updatedAt ?? null,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.voiceProfileEnabledAt) {
    return NextResponse.json(
      { error: "Voice Profile Pack is required before creating a Voice Profile." },
      { status: 403 },
    );
  }

  const parsed = voiceProfileInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid writing samples" },
      { status: 400 },
    );
  }

  try {
    const profile = await generateVoiceProfile(parsed.data.posts);
    const now = new Date();

    await db
      .insert(voiceProfiles)
      .values({
        id: `vpf_${crypto.randomUUID().replace(/-/g, "")}`,
        userId: user.id,
        sourcePosts: JSON.stringify(parsed.data.posts),
        profile: JSON.stringify(profile),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: voiceProfiles.userId,
        set: {
          sourcePosts: JSON.stringify(parsed.data.posts),
          profile: JSON.stringify(profile),
          updatedAt: now,
        },
      });

    return NextResponse.json({ profile, sourceCount: parsed.data.posts.length, updatedAt: now });
  } catch (error) {
    console.error("Voice Profile generation failed", error);
    return NextResponse.json(
      { error: "Voice Profile generation is temporarily unavailable." },
      { status: 502 },
    );
  }
}
