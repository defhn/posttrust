import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, creditLedger } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import * as crypto from "crypto";

const TARGET_EMAIL = "defhnhqf@gmail.com";
const TARGET_CREDITS = 1000;

async function main() {
  const sqlClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(sqlClient);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, TARGET_EMAIL))
    .limit(1);

  if (!existing[0]) {
    console.error(`❌ 找不到邮箱 ${TARGET_EMAIL}`);
    process.exit(1);
  }

  const user = existing[0];
  console.log(`✅ 找到用户: ${user.email} (${user.id})`);

  const [bal] = await db
    .select({ balance: sql<number>`COALESCE(SUM(${creditLedger.delta}), 0)::integer` })
    .from(creditLedger)
    .where(eq(creditLedger.userId, user.id));

  const current = bal?.balance ?? 0;
  console.log(`📊 当前余额: ${current} credits`);

  const topUp = TARGET_CREDITS - current;
  if (topUp <= 0) {
    console.log(`ℹ️  余额 ${current} 已达到或超过目标 ${TARGET_CREDITS}`);
    process.exit(0);
  }

  await db.insert(creditLedger).values({
    id: `crd_${crypto.randomUUID().replace(/-/g, "")}`,
    userId: user.id,
    delta: topUp,
    reason: "admin_grant",
  });

  console.log(`🎉 充值成功: +${topUp} → 新余额: ${TARGET_CREDITS} credits`);
}

main().catch((e) => { console.error(e); process.exit(1); });
