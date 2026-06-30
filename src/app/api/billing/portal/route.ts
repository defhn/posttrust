import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe billing account is linked." }, { status: 400 });
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Could not create Stripe Customer Portal session", error);
    return NextResponse.json({ error: "Billing management is temporarily unavailable." }, { status: 502 });
  }
}
