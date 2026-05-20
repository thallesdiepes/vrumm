import "server-only";
import Stripe from "stripe";

// =============================================
// Cliente Stripe (server-only) — instancia uma vez por processo.
// =============================================

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY ausente. Defina no .env.local (modo teste: sk_test_...)"
      );
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

// =============================================
// Lookup keys configurados no painel Stripe.
// Resolvemos pra Price IDs em runtime — assim o código não
// depende de IDs gerados (mais portável entre teste/produção).
// =============================================

export const STRIPE_LOOKUP_KEYS = {
  setup: "vrumm_setup",
  monthly: "vrumm_monthly",
} as const;

const priceIdCache = new Map<string, string>();

export async function getPriceIdByLookupKey(lookupKey: string): Promise<string> {
  const cached = priceIdCache.get(lookupKey);
  if (cached) return cached;

  const stripe = getStripe();
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  const price = prices.data[0];
  if (!price) {
    throw new Error(
      `Price com lookup_key="${lookupKey}" não encontrado na Stripe. ` +
        `Confira em Produtos → Preços → Mais opções de preço → Chave de pesquisa.`
    );
  }

  priceIdCache.set(lookupKey, price.id);
  return price.id;
}

// =============================================
// Helper: reconstrói a origem pública (mesma lógica do /auth/callback)
// Quando rodando atrás de proxy reverso, request.url é interno.
// =============================================

export function getPublicOrigin(headers: Headers): string {
  const forwardedHost = headers.get("x-forwarded-host");
  const forwardedProto = headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
