import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white race-stripe dot-pattern">
      {/* Background gradient wash */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[60vh] bg-amber-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[30vw] h-[40vh] bg-amber-600/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">

        {/* Navigation */}
        <nav className="flex items-center justify-between py-7">
          <span className="font-display font-black text-2xl uppercase tracking-tight text-white">
            VRUMM
          </span>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-sans font-medium text-white/50 hover:text-white transition-colors tracking-widest uppercase"
          >
            Entrar <ArrowUpRight className="w-3 h-3" />
          </Link>
        </nav>

        {/* Hero */}
        <section className="pt-16 pb-20 relative">
          {/* Decorative racing number */}
          <span
            className="absolute right-0 top-8 font-display font-black select-none pointer-events-none leading-none text-white/[0.025]"
            style={{ fontSize: "clamp(120px, 22vw, 320px)" }}
            aria-hidden
          >
            01
          </span>

          <div className="relative max-w-3xl">
            <p className="font-sans text-amber-400 text-xs font-semibold uppercase tracking-[0.35em] mb-8">
              Software para estéticas automotivas
            </p>

            <h1
              className="font-display font-black uppercase leading-[0.92] tracking-tight text-white mb-8"
              style={{ fontSize: "clamp(60px, 10vw, 130px)" }}
            >
              ORÇAMENTO
              <br />
              FEITO.
              <br />
              <span className="text-amber-400">ENTREGUE.</span>
            </h1>

            <p className="font-sans text-white/50 text-base leading-relaxed max-w-md mb-10">
              Do cadastro ao WhatsApp em segundos. Gestão de clientes,
              catálogo de serviços e kanban de status — tudo no mesmo lugar.
            </p>

            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="font-display font-bold uppercase tracking-wider text-sm bg-amber-400 text-black px-8 py-4 hover:bg-white transition-colors"
              >
                CRIAR CONTA GRÁTIS
              </Link>
              <Link
                href="/login"
                className="font-sans text-sm text-white/40 hover:text-white transition-colors underline underline-offset-4"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="relative h-px mb-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        </div>

        {/* Features — editorial numbered list */}
        <section className="pb-24">
          <div className="space-y-0 divide-y divide-white/[0.05]">
            {[
              {
                n: "01",
                title: "ORÇAMENTOS EM 30 SEGUNDOS",
                desc: "Selecione o cliente, adicione os serviços e o orçamento está pronto. Um link público gerado automaticamente para o cliente acompanhar.",
              },
              {
                n: "02",
                title: "DIRETO NO WHATSAPP",
                desc: "Um botão envia o orçamento com nome, total e link para o WhatsApp do cliente. Sem copiar, sem colar, sem erro.",
              },
              {
                n: "03",
                title: "KANBAN DE STATUS EM TEMPO REAL",
                desc: "Visualize cada carro: aguardando aprovação, em execução, pronto para entrega. Arraste ou avance com um clique.",
              },
            ].map((f) => (
              <div
                key={f.n}
                className="group grid grid-cols-[auto_1fr_1fr] gap-8 lg:gap-16 py-8 items-start hover:bg-white/[0.01] transition-colors"
              >
                <span className="font-display font-black text-white/20 text-sm pt-0.5 group-hover:text-amber-400/60 transition-colors tracking-wider">
                  {f.n}
                </span>
                <h3 className="font-display font-black text-white text-lg lg:text-xl uppercase tracking-tight leading-tight">
                  {f.title}
                </h3>
                <p className="font-sans text-white/45 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-20">
          <div className="border border-white/[0.07] p-10 lg:p-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <h2
                className="font-display font-black uppercase leading-tight text-white"
                style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
              >
                PRONTO PARA
                <br />
                <span className="text-amber-400">ACELERAR?</span>
              </h2>
              <p className="font-sans text-white/40 text-sm mt-3">
                Gratuito para começar. Sem cartão de crédito.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 font-display font-bold uppercase tracking-wider text-sm bg-amber-400 text-black px-8 py-4 hover:bg-white transition-colors flex items-center gap-2"
            >
              COMEÇAR AGORA <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.05] py-6 flex items-center justify-between">
          <span className="font-display font-black text-white/20 text-sm uppercase tracking-tight">VRUMM</span>
          <span className="font-sans text-white/20 text-xs">
            © {new Date().getFullYear()}
          </span>
        </footer>
      </div>
    </main>
  );
}
