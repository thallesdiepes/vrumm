import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Clock, AlertTriangle, XCircle, CreditCard } from "lucide-react";
import { VrummLogo } from "@/components/layout/vrumm-logo";
import { createCustomerPortalSession } from "@/app/actions/stripe";

export default async function AguardandoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, tenant_id")
    .eq("id", user.id)
    .single();

  if (profile?.is_active) redirect("/dashboard");

  // Carrega status da assinatura pra decidir qual mensagem mostrar
  const { data: tenant } = await supabase
    .from("tenants")
    .select("subscription_status, stripe_customer_id")
    .eq("id", profile?.tenant_id)
    .single();

  const status = tenant?.subscription_status ?? "inactive";
  const hasStripeCustomer = !!tenant?.stripe_customer_id;

  async function handleLogout() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/login");
  }

  // Decide qual variante mostrar
  const variant: "past_due" | "canceled" | "pending" =
    status === "past_due" ? "past_due" :
    status === "canceled" ? "canceled" :
    "pending";

  const variants = {
    pending: {
      icon: Clock,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10 border-amber-400/20",
      title: <>Acesso <span className="text-amber-400">pendente</span></>,
      desc: "Sua conta foi criada com sucesso. Assim que o acesso for liberado, você poderá entrar no painel normalmente.",
    },
    past_due: {
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10 border-amber-400/20",
      title: <>Pagamento <span className="text-amber-400">atrasado</span></>,
      desc: "Sua última cobrança não foi confirmada. Atualize o cartão pra retomar o acesso ao painel.",
    },
    canceled: {
      icon: XCircle,
      iconColor: "text-red-400",
      iconBg: "bg-red-400/10 border-red-400/20",
      title: <>Assinatura <span className="text-red-400">cancelada</span></>,
      desc: "Sua assinatura foi encerrada. Pra reativar a conta e voltar a acessar o painel, fale com a gente.",
    },
  };

  const v = variants[variant];
  const Icon = v.icon;

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <VrummLogo iconSize={36} textClass="text-2xl text-white" />
        </div>

        <div className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto mb-6 ${v.iconBg}`}>
          <Icon className={`w-6 h-6 ${v.iconColor}`} />
        </div>

        <h1 className="font-display font-black text-3xl uppercase tracking-tight mb-3">
          {v.title}
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          {v.desc}
        </p>

        <p className="text-white/30 text-xs mb-8">
          Logado como <span className="text-white/50">{user.email}</span>
        </p>

        {/* CTA condicional: portal pra past_due, WhatsApp pra canceled, nada pra pending */}
        {variant === "past_due" && hasStripeCustomer && (
          <form action={createCustomerPortalSession} className="mb-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-white text-black font-display font-bold uppercase tracking-wider text-xs px-6 py-3 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Atualizar cartão
            </button>
          </form>
        )}

        {variant === "canceled" && (
          <a
            href="https://wa.me/5521998258856?text=Quero%20reativar%20minha%20conta%20VRUMM"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-white text-black font-display font-bold uppercase tracking-wider text-xs px-6 py-3 transition-colors mb-6"
          >
            Falar no WhatsApp
          </a>
        )}

        <form action={handleLogout}>
          <button
            type="submit"
            className="text-white/30 hover:text-white/60 text-sm transition-colors underline underline-offset-4"
          >
            Sair da conta
          </button>
        </form>
      </div>
    </main>
  );
}
