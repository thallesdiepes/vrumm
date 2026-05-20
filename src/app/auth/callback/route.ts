import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Quando rodando atrás de proxy reverso (Coolify/Traefik), request.url
  // contém o endereço interno (0.0.0.0:3000). Usamos os headers forwarded
  // para reconstruir a origem pública correta.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      try {
        await ensureProfileExists(supabase);
        return NextResponse.redirect(`${origin}${next}`);
      } catch {
        return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

/**
 * Garante que o usuário tenha um profile/tenant criados.
 *
 * Fluxo de pagamento (esperado):
 *  1. Cliente paga no Stripe → webhook grava pending_signups com status='paid'
 *  2. Cliente loga com Google → cai aqui
 *  3. Procuramos pending_signups pelo email
 *  4. Se encontrado e pago: criamos tenant com is_active=true + stripe_customer_id
 *  5. Marcamos pending_signups como 'consumed'
 *
 * Fluxo sem pagamento (legado):
 *  Cria tenant com is_active=false → cai em /aguardando.
 *  Mantemos isso pra contas de teste/parceiros que você libera manualmente.
 */
async function ensureProfileExists(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Profile já existe? Nada a fazer.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  if (profile) return;

  const fullName = user.user_metadata?.full_name ?? user.email ?? "Usuário";
  const email = (user.email ?? "").toLowerCase();

  // Procuramos pagamento pendente pelo email (usa admin client pra bypassar RLS)
  const admin = createAdminClient();
  let paidStripeCustomerId: string | null = null;

  if (email) {
    const { data: pending } = await admin
      .from("pending_signups")
      .select("stripe_customer_id, status")
      .eq("email", email)
      .eq("status", "paid")
      .maybeSingle();

    if (pending) {
      paidStripeCustomerId = pending.stripe_customer_id;
    }
  }

  // Cria tenant — se pagou, já ativo; senão, aguardando aprovação
  const isPaid = paidStripeCustomerId !== null;
  const { error: rpcErr } = await supabase.rpc("create_tenant_and_profile", {
    user_full_name: fullName,
    initial_is_active: isPaid,
    initial_stripe_customer_id: paidStripeCustomerId,
  });

  if (rpcErr) {
    console.error("[auth/callback] falha ao criar perfil:", rpcErr.message);
    throw new Error("Falha ao criar perfil do usuário.");
  }

  // Consome o pending_signup pra não reutilizar (idempotência)
  if (isPaid && email) {
    await admin
      .from("pending_signups")
      .update({ status: "consumed", consumed_at: new Date().toISOString() })
      .eq("email", email);
  }
}
