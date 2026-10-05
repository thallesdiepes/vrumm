import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimPendingSignup } from "@/lib/billing/claim-pending-signup";

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
 * Garante que o usuário tenha um profile/tenant e ativa se já pagou.
 *
 *  1. Primeiro login → RPC cria tenant + profile sempre INATIVOS
 *  2. Todo login → se o profile está inativo, procura pagamento confirmado
 *     (pending_signups pelo email) e ativa via service_role
 *
 * O passo 2 roda também pra profiles já existentes: cobre quem logou
 * antes de pagar (antes ficava preso em /aguardando pra sempre).
 * Contas sem pagamento continuam em /aguardando pra liberação manual.
 */
async function ensureProfileExists(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const fullName = user.user_metadata?.full_name ?? user.email ?? "Usuário";
    const { error: rpcErr } = await supabase.rpc("create_tenant_and_profile", {
      user_full_name: fullName,
    });
    if (rpcErr) {
      console.error("[auth/callback] falha ao criar perfil:", rpcErr.message);
      throw new Error("Falha ao criar perfil do usuário.");
    }
  } else if (profile.is_active) {
    return;
  }

  await claimPendingSignup(user.id, user.email);
}
