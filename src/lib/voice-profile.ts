import { z } from "zod";

export const voiceProfileInputSchema = z.object({
  posts: z
    .array(z.string().trim().min(80).max(3000))
    .min(3, "Add at least 3 posts")
    .max(5, "Use no more than 5 posts"),
});

export const voiceProfileSchema = z.object({
  summary: z.string().min(20),
  toneTraits: z.array(z.string()).min(2).max(8),
  rhythmRules: z.array(z.string()).min(2).max(8),
  evidenceHabits: z.array(z.string()).min(1).max(8),
  structurePatterns: z.array(z.string()).min(1).max(8),
  phrasesToAvoid: z.array(z.string()).max(12),
  rewriteInstructions: z.array(z.string()).min(3).max(12),
});

export type VoiceProfile = z.infer<typeof voiceProfileSchema>;

export function formatVoiceProfileForPrompt(profile: VoiceProfile): string {
  return [
    profile.summary,
    `Tone: ${profile.toneTraits.join("; ")}`,
    `Rhythm: ${profile.rhythmRules.join("; ")}`,
    `Evidence habits: ${profile.evidenceHabits.join("; ")}`,
    `Structure: ${profile.structurePatterns.join("; ")}`,
    `Avoid: ${profile.phrasesToAvoid.join("; ") || "No repeated phrases identified"}`,
    `Rewrite rules: ${profile.rewriteInstructions.join("; ")}`,
  ].join("\n");
}
