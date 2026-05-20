import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCustomerPortalSession } from "@/app/actions/stripe";
import { CreditCard, ExternalLink, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; tone: string; bg: string; icon: typeof CheckCircle2 }> = {
  active: {
    label: "Ativa",
    tone: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20",
    icon: CheckCircle2,
  },
  past_due: {
    label: "Pagamento pendente",
    tone: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    icon: AlertTriangle,
  },
  canceled: {
    label: "Cancelada",
    tone: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
    icon: XCircle,
  },
  incomplete: {
    label: "Incompleta",
    tone: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    icon: AlertTriangle,
  },
  inactive: {
    label: "Inativa",
    tone: "text-gray-500 dark:text-zinc-400",
    bg: "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700",
    icon: XCircle,
  },
};

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, stripe_customer_id, subscription_status, subscription_id, created_at")
    .eq("id", profile?.tenant_id)
    .single();

  if (!tenant) redirect("/dashboard");

  const status = STATUS_LABELS[tenant.subscription_status] ?? STATUS_LABELS.inactive;
  const StatusIcon = status.icon;
  const hasStripeCustomer = !!tenant.stripe_customer_id;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Cobrança</h1>
        <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">
          Status da sua assinatura e gerenciamento de pagamento.
        </p>
      </div>

      {/* Card de status */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-widest mb-1.5">
              Plano
            </p>
            <p className="text-gray-900 dark:text-zinc-100 font-semibold text-lg">
              VRUMM Sistema
            </p>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">
              R$ 189,00 / mês — renovação automática
            </p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${status.bg} ${status.tone}`}>
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </div>
        </div>

        {tenant.subscription_status === "past_due" && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 mb-5">
            <p className="text-amber-700 dark:text-amber-400 text-sm font-medium mb-1">
              Sua última cobrança falhou.
            </p>
            <p className="text-amber-600 dark:text-amber-400/80 text-xs">
              Atualize seu cartão no portal de cobrança pra evitar suspensão do acesso.
            </p>
          </div>
        )}

        {tenant.subscription_status === "canceled" && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4 mb-5">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium mb-1">
              Sua assinatura foi cancelada.
            </p>
            <p className="text-red-600 dark:text-red-400/80 text-xs">
              Reative sua conta entrando em contato pelo WhatsApp.
            </p>
          </div>
        )}

        {hasStripeCustomer ? (
          <form action={createCustomerPortalSession}>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Gerenciar assinatura
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>
          </form>
        ) : (
          <div className="text-gray-500 dark:text-zinc-400 text-sm bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4">
            Sua conta ainda não tem assinatura Stripe vinculada — provavelmente uma
            conta de teste ou parceira. Pra ativar a cobrança, fale com a gente.
          </div>
        )}
      </div>

      {/* Info adicional */}
      <div className="text-xs text-gray-400 dark:text-zinc-500 space-y-1.5 px-1">
        <p>
          • No portal de cobrança você pode trocar o cartão, baixar faturas e cancelar a assinatura.
        </p>
        <p>
          • O cancelamento entra em vigor no fim do ciclo atual — você não perde acesso imediatamente.
        </p>
        <p>
          • Em caso de dúvida sobre cobrança, fale conosco direto pelo WhatsApp.
        </p>
      </div>
    </div>
  );
}
