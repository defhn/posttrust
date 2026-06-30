import { NextResponse } from "next/server";
import { db } from "@/db";
import { magicLinks, users, creditLedger } from "@/db/schema";
import { hashToken, setSessionCookie } from "@/lib/auth";
import { eq, and, gt, isNull } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/?error=missing_token", req.url)
      );
    }

    const tokenHash = hashToken(token);

    // Find magic link
    const linkResult = await db
      .select()
      .from(magicLinks)
      .where(
        and(
          eq(magicLinks.tokenHash, tokenHash),
          isNull(magicLinks.usedAt),
          gt(magicLinks.expiresAt, new Date())
        )
      )
      .limit(1);

    if (linkResult.length === 0) {
      return NextResponse.redirect(
        new URL("/?error=magic_link_expired_or_invalid", req.url)
      );
    }

    const magicLink = linkResult[0];

    // Mark link as used
    await db
      .update(magicLinks)
      .set({ usedAt: new Date() })
      .where(eq(magicLinks.id, magicLink.id));

    const email = magicLink.email.toLowerCase();

    // Check if user exists
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;

    if (userResult.length === 0) {
      // Create user
      userId = `usr_${crypto.randomUUID().replace(/-/g, "")}`;
      await db.insert(users).values({
        id: userId,
        email,
      });

      // Grant 1 free credit in the ledger as specified: "One full audit is free."
      await db.insert(creditLedger).values({
        id: `crd_${crypto.randomUUID().replace(/-/g, "")}`,
        userId,
        delta: 1,
        reason: "free_credit",
      });
    } else {
      userId = userResult[0].id;
    }

    // Set session cookie and create DB session
    await setSessionCookie(userId);

    // Redirect to homepage with success parameter so client-side draft can be verified and submitted
    return NextResponse.redirect(
      new URL("/?login=success", req.url)
    );
  } catch (error) {
    console.error("Magic link verification error:", error);
    return NextResponse.redirect(
      new URL("/?error=verification_failed", req.url)
    );
  }
}
