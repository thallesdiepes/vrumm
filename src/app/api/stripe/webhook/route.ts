import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe SDK precisa de Node (crypto). Não roda em edge.
export const runtime = "nodejs";

/**
 * Webhook Stripe → Supabase
 *
 * Eventos tratados:
 *  • checkout.session.completed     → grava pending_signups (status=paid)
 *  • customer.subscription.created  → tenta sincronizar tenant (se já existe)
 *  • customer.subscription.updated  → atualiza subscription_status do tenant
 *  • customer.subscription.deleted  → marca tenant como canceled + desativa profile
 *  • invoice.payment_failed         → marca tenant como past_due
 *
 * Setup local: stripe listen --forward-to localhost:3000/api/stripe/webhook
 * Setup prod:  registrar o endpoint público em Stripe → Developers → Webhooks
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET ausente");
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Stripe-Signature ausente" }, { status: 400 });
  }

  // IMPORTANTE: precisa do body cru, não parseado.
  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    console.error("[stripe-webhook] assinatura inválida:", msg);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        // Outros eventos: devolvemos 200 pra evitar retry desnecessário.
        console.log("[stripe-webhook] evento não tratado:", event.type);
    }
  } catch (e) {
    console.error(`[stripe-webhook] erro processando ${event.type}:`, e);
    return NextResponse.json({ error: "Erro processando evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email ?? session.customer_email;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!email || !customerId) {
    console.error("[stripe-webhook] checkout sem email/customer:", session.id);
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const admin = createAdminClient();

  // Upsert por email (PK) — se o cliente tentar comprar 2x antes de logar, último ganha.
  const { error } = await admin.from("pending_signups").upsert({
    email: email.toLowerCase(),
    stripe_customer_id: customerId,
    stripe_session_id: session.id,
    status: "paid",
    paid_at: new Date().toISOString(),
    metadata: {
      subscription_id: subscriptionId,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
    },
  });

  if (error) {
    console.error("[stripe-webhook] erro upsertando pending_signup:", error);
    throw new Error(error.message);
  }

  console.log("[stripe-webhook] pending_signup criado:", email);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!tenant) {
    // Esperado entre checkout.session.completed e o login Google. Reentry via outros eventos depois.
    console.log("[stripe-webhook] subscription update sem tenant ainda:", customerId);
    return;
  }

  const tenantStatus = mapSubscriptionStatus(sub.status);

  const { error: tErr } = await admin
    .from("tenants")
    .update({
      subscription_id: sub.id,
      subscription_status: tenantStatus,
    })
    .eq("id", tenant.id);
  if (tErr) throw new Error(tErr.message);

  // Sincroniza is_active dos profiles do tenant com o status da assinatura
  const isActive = tenantStatus === "active";
  await admin.from("profiles").update({ is_active: isActive }).eq("tenant_id", tenant.id);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!tenant) return;

  await admin
    .from("tenants")
    .update({ subscription_status: "canceled" })
    .eq("id", tenant.id);
  await admin.from("profiles").update({ is_active: false }).eq("tenant_id", tenant.id);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!tenant) return;

  await admin
    .from("tenants")
    .update({ subscription_status: "past_due" })
    .eq("id", tenant.id);
}

// ─────────────────────────────────────────────────────────────
// Mapeamento de status Stripe → status interno
// ─────────────────────────────────────────────────────────────

function mapSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
      return "incomplete";
    default:
      return "inactive";
  }
}
