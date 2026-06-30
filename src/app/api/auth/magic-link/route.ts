import { NextResponse } from "next/server";
import { db } from "@/db";
import { magicLinks } from "@/db/schema";
import { generateRandomToken, hashToken } from "@/lib/auth";
import { sendEmail } from "@/lib/brevo";
import { z } from "zod";

const requestSchema = z.object({
  email: z.string().email(),
  consent: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = requestSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const { email, consent } = result.data;

    // Generate token and hash
    const rawToken = generateRandomToken();
    const tokenHash = hashToken(rawToken);
    
    // Set 15 mins expiry
    const expiresAt = new Date();
    const ttlMinutes = parseInt(process.env.MAGIC_LINK_TTL_MINUTES || "15", 10);
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    // Save magic link in DB
    const tokenId = crypto.randomUUID();
    await db.insert(magicLinks).values({
      id: tokenId,
      tokenHash,
      email: email.toLowerCase(),
      expiresAt,
    });

    // Build verify link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLinkUrl = `${appUrl}/api/auth/verify?token=${rawToken}`;

    // Send email via Brevo
    const templateId = parseInt(process.env.BREVO_MAGIC_LINK_TEMPLATE_ID || "1", 10);
    const emailSent = await sendEmail({
      toEmail: email,
      subject: "Sign in to PostTrust",
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; color: #171A18; background-color: #F7F8F6;">
          <h2 style="color: #176B4D;">Sign in to PostTrust</h2>
          <p>Click the link below to verify your email and sign in to your PostTrust account. This link is valid for 15 minutes and can only be used once.</p>
          <div style="margin: 30px 0;">
            <a href="${magicLinkUrl}" style="background-color: #176B4D; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email & Sign In</a>
          </div>
          <p style="font-size: 12px; color: #666;">If you didn't request this link, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #DDD; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">Or copy and paste this URL into your browser:<br/>${magicLinkUrl}</p>
        </div>
      `,
      templateId,
      templateParams: {
        magic_link: magicLinkUrl,
      },
    });

    if (!emailSent) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({
          success: true,
          devMagicLink: magicLinkUrl,
          warning: "Email delivery failed in development. Use the devMagicLink to continue testing.",
        });
      }

      return NextResponse.json(
        { error: "Failed to send login email. Please try again later." },
        { status: 500 }
      );
    }

    // If consent is checked, the PRD says: "只有用户明确勾选订阅后，才调用 Contacts API 把邮箱加入 BREVO_CONTACT_LIST_ID"
    // We can handle marketing list subscription asynchronously here
    if (consent) {
      subscribeEmailToBrevo(email).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Magic link request error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

async function subscribeEmailToBrevo(email: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const listIdStr = process.env.BREVO_CONTACT_LIST_ID;
  
  if (!apiKey || apiKey.includes("replace_with") || !listIdStr) {
    return;
  }

  const listId = parseInt(listIdStr, 10);
  if (isNaN(listId) || listId <= 0) return;

  try {
    await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        listIds: [listId],
        updateEnabled: true,
      }),
    });
  } catch (error) {
    console.error("Error subscribing contact to Brevo:", error);
  }
}
