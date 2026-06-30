import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { audits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

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
