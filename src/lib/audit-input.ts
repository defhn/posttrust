import { z } from "zod";

const commonFields = {
  audience: z.string().trim().max(200).optional(),
  goal: z.string().trim().max(100).optional(),
  tone: z.boolean().optional().default(true),
};

export const auditRequestSchema = z.discriminatedUnion("type", [
  z.object({
    ...commonFields,
    type: z.literal("post"),
    content: z.string().trim().min(80, "Draft is too short (minimum 80 characters)").max(3000),
  }),
  z.object({
    ...commonFields,
    type: z.literal("article"),
    content: z.string().trim().min(80, "Draft is too short (minimum 80 characters)").max(12000),
  }),
]);
