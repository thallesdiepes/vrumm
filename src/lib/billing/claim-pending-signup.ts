import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ativa o tenant do usuário se existir um pagamento confirmado
 * (pending_signups com status='paid') para o e-mail dele.
 *
 * Roda com service_role — é o ÚNICO caminho que liga is_active/subscription
 * a partir do login. Chamado em:
 *  • /auth/callback  → todo login (perfil novo ou já existente)
 *  • /aguardando     → ao abrir a página, cobre quem já estava logado
 *                      quando o webhook chegou
 *
 * Retorna true se ativou.
 */
export async function claimPendingSignup(userId: string, email: string | undefined): Promise<boolean> {
  const normalized = (email ?? "").toLowerCase();
  if (!normalized) return false;

  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("pending_signups")
    .select("stripe_customer_id, metadata")
    .eq("email", normalized)
    .eq("status", "paid")
    .maybeSingle();
  if (!pending) return false;

  const { data: profile } = await admin
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return false;

  const subscriptionId =
    (pending.metadata as { subscription_id?: string | null } | null)?.subscription_id ?? null;

  const { error: tErr } = await admin
    .from("tenants")
    .update({
      stripe_customer_id: pending.stripe_customer_id,
      subscription_id: subscriptionId,
      subscription_status: "active",
    })
    .eq("id", profile.tenant_id);
  if (tErr) {
    console.error("[claimPendingSignup] erro atualizando tenant:", tErr.message);
    return false;
  }

  const { error: pErr } = await admin
    .from("profiles")
    .update({ is_active: true })
    .eq("tenant_id", profile.tenant_id);
  if (pErr) {
    console.error("[claimPendingSignup] erro ativando profiles:", pErr.message);
    return false;
  }

  await admin
    .from("pending_signups")
    .update({ status: "consumed", consumed_at: new Date().toISOString() })
    .eq("email", normalized);

  return true;
}
