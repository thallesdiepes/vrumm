"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  getPriceIdByLookupKey,
  STRIPE_LOOKUP_KEYS,
  getPublicOrigin,
} from "@/lib/stripe/server";

// =============================================
// createCheckoutSession
//
// Chamada pelo botão "Pagar e começar" da landing.
// Cria uma sessão de Checkout no modo subscription com dois line items:
//   • vrumm_monthly  (R$ 189/mês recorrente)
//   • vrumm_setup    (R$ 500 one-time — taxa de implementação)
//
// Stripe Brasil aceita cartão + Pix automaticamente nessa configuração.
// Redireciona o usuário pra checkout.stripe.com.
// =============================================

export async function createCheckoutSession() {
  const stripe = getStripe();

  const [setupPriceId, monthlyPriceId] = await Promise.all([
    getPriceIdByLookupKey(STRIPE_LOOKUP_KEYS.setup),
    getPriceIdByLookupKey(STRIPE_LOOKUP_KEYS.monthly),
  ]);

  const origin = getPublicOrigin(await headers());

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      { price: monthlyPriceId, quantity: 1 },
      { price: setupPriceId, quantity: 1 },
    ],
    locale: "pt-BR",
    billing_address_collection: "required",
    allow_promotion_codes: true,
    success_url: `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?canceled=1`,
    subscription_data: {
      // Metadata persiste no objeto Subscription — útil pro webhook
      metadata: { source: "landing" },
    },
  });

  if (!session.url) {
    throw new Error("Stripe não devolveu URL de checkout");
  }

  redirect(session.url);
}

// =============================================
// createCustomerPortalSession
//
// Chamada pelo botão "Gerenciar assinatura" em /dashboard/billing.
// Cria sessão do Customer Portal e redireciona o cliente.
// O portal deixa o cliente trocar cartão, baixar fatura, cancelar.
// =============================================

export async function createCustomerPortalSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(stripe_customer_id)")
    .eq("id", user.id)
    .single();

  // Supabase tipa a relação como array; pegamos o primeiro registro
  const tenantsRel = profile?.tenants as
    | { stripe_customer_id: string | null }
    | { stripe_customer_id: string | null }[]
    | null;
  const customerId = Array.isArray(tenantsRel)
    ? tenantsRel[0]?.stripe_customer_id
    : tenantsRel?.stripe_customer_id;

  if (!customerId) {
    throw new Error("Tenant sem stripe_customer_id — assinatura não foi criada via Stripe.");
  }

  const stripe = getStripe();
  const origin = getPublicOrigin(await headers());

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard/billing`,
  });

  redirect(portal.url);
}
