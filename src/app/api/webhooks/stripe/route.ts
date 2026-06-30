import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "@/db";
import { creditLedger, purchases, users } from "@/db/schema";
import { getCheckoutEntitlement, getInvoiceEntitlement } from "@/lib/billing-entitlements";
import { sendEmail } from "@/lib/brevo";
import { getStripe } from "@/lib/stripe";

function objectId(value: string | { id: string } | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function handleCheckout(event: Stripe.Event, session: Stripe.Checkout.Session) {
  if (event.type === "checkout.session.completed" && !["paid", "no_payment_required"].includes(session.payment_status)) {
    return;
  }

  const userId = session.client_reference_id;
  if (!userId) throw new Error("Checkout Session is missing client_reference_id.");

  const stripe = getStripe();
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ["line_items"] });
  const lineItems = fullSession.line_items?.data ?? [];
  if (lineItems.length === 0) throw new Error("Checkout Session has no line items.");

  const entitlements = lineItems.flatMap((item) => {
    const priceId = item.price?.id;
    if (!priceId) return [];
    const entitlement = getCheckoutEntitlement(priceId, item.quantity ?? 1);
    return entitlement ? [entitlement] : [];
  });
  const credits = entitlements.reduce((total, entitlement) => total + entitlement.credits, 0);
  const enablesVoiceProfile = entitlements.some((entitlement) => entitlement.enablesVoiceProfile);
  const customerId = objectId(fullSession.customer);
  const subscriptionId = objectId(fullSession.subscription);

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("Checkout user was not found.");

  let fulfilled = false;
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: purchases.id })
      .from(purchases)
      .where(eq(purchases.stripeSessionId, fullSession.id))
      .limit(1);
    if (existing) return;

    await tx.insert(purchases).values({
      id: `pur_${crypto.randomUUID().replace(/-/g, "")}`,
      stripeSessionId: fullSession.id,
      stripePriceId: lineItems[0].price?.id ?? "unknown",
      status: "completed",
      userId,
    });

    await tx
      .update(users)
      .set({
        stripeCustomerId: customerId ?? user.stripeCustomerId,
        stripeSubscriptionId: subscriptionId ?? user.stripeSubscriptionId,
        subscriptionStatus: subscriptionId ? "active" : user.subscriptionStatus,
        voiceProfileEnabledAt: enablesVoiceProfile ? new Date() : user.voiceProfileEnabledAt,
      })
      .where(eq(users.id, userId));

    if (credits > 0) {
      await tx.insert(creditLedger).values({
        id: `crd_${crypto.randomUUID().replace(/-/g, "")}`,
        userId,
        delta: credits,
        reason: entitlements[0]?.reason ?? "purchase",
        stripeEventId: event.id,
      });
    }
    fulfilled = true;
  });

  if (fulfilled && credits > 0) {
    void sendEmail({
      toEmail: user.email,
      subject: "Your PostTrust purchase is ready",
      htmlContent: `<p>${credits} audit credits have been added to your PostTrust account.</p>`,
      templateId: Number(process.env.BREVO_PURCHASE_TEMPLATE_ID || 0),
      templateParams: { credits_added: String(credits) },
    });
  }
}

async function handlePaidInvoice(event: Stripe.Event, invoice: Stripe.Invoice) {
  const entitlement = invoice.lines.data
    .map((line) => objectId(line.pricing?.price_details?.price ?? null))
    .filter((priceId): priceId is string => Boolean(priceId))
    .map((priceId) => getInvoiceEntitlement(priceId))
    .find((candidate) => candidate !== null);
  if (!entitlement) return;

  const customerId = objectId(invoice.customer);
  if (!customerId) throw new Error("Paid invoice is missing a customer.");

  const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  if (!user) throw new Error("Invoice customer is not linked yet; retry this event.");

  const subscriptionId = objectId(invoice.parent?.subscription_details?.subscription ?? null);
  await db.transaction(async (tx) => {
    await tx
      .insert(creditLedger)
      .values({
        id: `crd_${crypto.randomUUID().replace(/-/g, "")}`,
        userId: user.id,
        delta: entitlement.credits,
        reason: entitlement.reason,
        stripeEventId: event.id,
      })
      .onConflictDoNothing({ target: creditLedger.stripeEventId });

    await tx
      .update(users)
      .set({
        stripeSubscriptionId: subscriptionId ?? user.stripeSubscriptionId,
        subscriptionStatus: "active",
      })
      .where(eq(users.id, user.id));
  });
}

async function handleSubscription(subscription: Stripe.Subscription) {
  await db
    .update(users)
    .set({
      stripeCustomerId: objectId(subscription.customer),
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    })
    .where(eq(users.stripeSubscriptionId, subscription.id));
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckout(event, event.data.object);
        break;
      case "invoice.paid":
        await handlePaidInvoice(event, event.data.object);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscription(event.data.object);
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook fulfillment failed", error);
    return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
  }
}
