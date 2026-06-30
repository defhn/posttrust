import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions, creditLedger } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import * as crypto from "crypto";

const SESSION_COOKIE_NAME = "posttrust_session";

// Hash a plain token
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Generate a random token
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Get the authenticated user based on request cookies
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    const sessionHash = hashToken(sessionToken);

    // Query session join user
    const result = await db
      .select({
        user: users,
        session: sessions,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.id, sessionHash),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0].user;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

// Get user credit balance from the ledger
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const result = await db
      .select({
        balance: sql<number>`COALESCE(SUM(${creditLedger.delta}), 0)::integer`,
      })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId));

    const balance = result[0]?.balance ?? 0;

    // Check if the user has any transactions yet. If they have none, we should check if they are eligible for 1 free credit.
    // However, we will handle the "1 free credit" insert at the time of the first audit or signup to keep the ledger clean.
    return balance;
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return 0;
  }
}

// Set a new session cookie for a user
export async function setSessionCookie(userId: string) {
  const sessionToken = generateRandomToken();
  const sessionHash = hashToken(sessionToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days session TTL

  // Insert session into DB
  await db.insert(sessions).values({
    id: sessionHash,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return sessionToken;
}

// Clear session cookie and session from DB
export async function logout() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      const sessionHash = hashToken(sessionToken);
      await db.delete(sessions).where(eq(sessions.id, sessionHash));
    }

    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  } catch (error) {
    console.error("Error in logout:", error);
  }
}
