import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ArrowUpRight, Mail, Shield } from "lucide-react";
import { getStripe } from "@/lib/stripe/server";
import { VrummLogo } from "@/components/layout/vrumm-logo";

/**
 * Página de retorno do Stripe Checkout.
 *
 * Recebe ?session_id={CHECKOUT_SESSION_ID} preenchido pelo Stripe.
 * Verifica a sessão na API da Stripe — não confiamos só na URL.
 *
 * Importante: a ATIVAÇÃO real do tenant acontece no webhook
 * (/api/stripe/webhook), não aqui. Essa página só confirma pro cliente
 * que deu certo e instrui o login com Google.
 */
export default async function CheckoutSucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/");

  const stripe = getStripe();

  let customerEmail: string | null = null;
  let paymentOk = false;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    customerEmail =
      session.customer_details?.email ?? session.customer_email ?? null;
    paymentOk =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
  } catch (e) {
    console.error("[checkout/sucesso] erro ao buscar sessão:", e);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white race-stripe flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/[0.05] rounded-full blur-[140px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <VrummLogo iconSize={28} textClass="text-xl text-white" />
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          {paymentOk ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>

              <h1
                className="font-display font-black uppercase leading-[0.95] tracking-tight text-white mb-3"
                style={{ fontSize: "clamp(36px, 6vw, 56px)" }}
              >
                PAGAMENTO
                <br />
                <span className="text-amber-400">CONFIRMADO.</span>
              </h1>

              <p className="font-sans text-white/55 text-base leading-relaxed mb-8">
                Boas-vindas ao VRUMM. Estamos liberando seu acesso agora —
                pode levar uns segundos.
              </p>

              {customerEmail && (
                <div className="border border-white/[0.08] bg-white/[0.02] p-5 mb-7 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <p className="font-sans text-amber-400 text-[11px] font-semibold uppercase tracking-[0.2em]">
                      Próximo passo
                    </p>
                  </div>
                  <p className="font-sans text-white/80 text-sm leading-relaxed">
                    Entre com sua conta Google usando o mesmo e-mail do pagamento:
                  </p>
                  <p className="font-mono text-amber-400 text-sm mt-2 break-all">
                    {customerEmail}
                  </p>
                </div>
              )}

              <Link
                href="/login?mode=login"
                className="inline-flex items-center justify-center gap-2 w-full font-display font-bold uppercase tracking-wider text-sm bg-amber-400 text-black px-7 py-4 hover:bg-white transition-colors"
              >
                Entrar com Google <ArrowUpRight className="w-4 h-4" />
              </Link>

              <div className="mt-7 flex items-start gap-2.5 text-white/40 text-xs font-sans text-left bg-white/[0.02] border border-white/[0.06] p-4">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Em até 24h te chamamos no WhatsApp pra agendar a vídeo-chamada
                  de onboarding. Enquanto isso, você já pode explorar o sistema.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-7 h-7 text-amber-400" />
              </div>

              <h1
                className="font-display font-black uppercase leading-[0.95] tracking-tight text-white mb-3"
                style={{ fontSize: "clamp(32px, 5vw, 48px)" }}
              >
                AGUARDANDO
                <br />
                <span className="text-amber-400">CONFIRMAÇÃO.</span>
              </h1>

              <p className="font-sans text-white/55 text-base leading-relaxed mb-8">
                Seu pagamento foi recebido pela Stripe, mas ainda não foi
                confirmado pelo banco. Isso costuma acontecer com Pix —
                normalmente leva poucos minutos. Você receberá um e-mail
                assim que confirmar.
              </p>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 font-sans text-white/50 hover:text-white text-sm transition-colors underline underline-offset-4"
              >
                Voltar pra landing
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
