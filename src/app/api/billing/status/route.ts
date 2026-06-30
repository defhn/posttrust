import { NextResponse } from "next/server";
import { getCurrentUser, getUserCredits } from "@/lib/auth";
import { db } from "@/db";
import { purchases } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // Query purchases table to see if it exists
    const purchaseResult = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.stripeSessionId, sessionId), eq(purchases.userId, user.id)))
      .limit(1);

    if (purchaseResult.length === 0) {
      return NextResponse.json({ completed: false });
    }

    const balance = await getUserCredits(user.id);

    return NextResponse.json({
      completed: true,
      balance,
    });
  } catch (error) {
    console.error("Billing status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
