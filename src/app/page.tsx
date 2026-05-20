import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  X,
  Zap,
  Shield,
  MessageCircle,
  Car,
  LayoutGrid,
  ClipboardCheck,
  Sparkles,
  Headphones,
  Star,
  ChevronDown,
} from "lucide-react";
import { VrummLogo, VrummIconMark } from "@/components/layout/vrumm-logo";
import { BuyButton } from "@/components/checkout/buy-button";
import { Toaster } from "@/components/ui/toast";

// Botão "Pagar e começar" usa <BuyButton> (dispara Stripe Checkout).
// Outros CTAs continuam apontando pra /login.
const LOGIN_CTA = "/login?mode=login";
const TALK_CTA = "/login";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white race-stripe dot-pattern overflow-hidden">
      {/* Ambient gradient wash */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[60vh] bg-amber-500/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[40vw] h-[50vh] bg-amber-600/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[30vw] h-[40vh] bg-amber-500/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <SiteNav />
        <Hero />
        <TrustBar />
        <Problem />
        <Features />
        <HowItWorks />
        <Pricing />
        <SocialProof />
        <FAQ />
        <FinalCTA />
        <SiteFooter />
      </div>

      {/* Toaster pra erros do BuyButton (ex: Stripe offline) */}
      <Toaster />
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────
   NAV
   ───────────────────────────────────────────────────────────── */
function SiteNav() {
  return (
    <nav className="flex items-center justify-between py-6">
      <VrummLogo iconSize={32} textClass="text-xl text-white" />

      <div className="hidden md:flex items-center gap-8 text-xs font-sans font-medium text-white/45 uppercase tracking-widest">
        <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
        <a href="#precos"   className="hover:text-white transition-colors">Preço</a>
        <a href="#faq"      className="hover:text-white transition-colors">FAQ</a>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={LOGIN_CTA}
          className="hidden sm:flex items-center gap-1.5 text-xs font-sans font-medium text-white/50 hover:text-white transition-colors tracking-widest uppercase"
        >
          Já sou cliente <ArrowUpRight className="w-3 h-3" />
        </Link>
        <BuyButton className="font-display font-bold uppercase tracking-wider text-xs bg-amber-400 text-black px-4 py-2.5 hover:bg-white transition-colors disabled:opacity-60">
          Começar
        </BuyButton>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="pt-12 pb-20 relative">
      {/* Big background number */}
      <span
        className="absolute right-0 -top-4 font-display font-black select-none pointer-events-none leading-none text-white/[0.025]"
        style={{ fontSize: "clamp(120px, 22vw, 320px)" }}
        aria-hidden
      >
        01
      </span>

      <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Copy */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 border border-amber-400/30 bg-amber-400/[0.06] px-3 py-1.5 mb-6">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="font-sans text-amber-400 text-[11px] font-semibold uppercase tracking-[0.25em]">
              Primeiro lote · vagas limitadas
            </span>
          </div>

          <h1
            className="font-display font-black uppercase leading-[0.92] tracking-tight text-white mb-6"
            style={{ fontSize: "clamp(50px, 9vw, 110px)" }}
          >
            DA PLACA
            <br />
            AO PIX EM
            <br />
            <span className="text-amber-400">30 SEGUNDOS.</span>
          </h1>

          <p className="font-sans text-white/55 text-base lg:text-lg leading-relaxed max-w-lg mb-8">
            O sistema da estética automotiva profissional. Cadastre o carro,
            monte o orçamento e mande no WhatsApp do cliente — tudo em um link.
            Acompanhe cada serviço no kanban até a entrega.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-7">
            <BuyButton className="font-display font-bold uppercase tracking-wider text-sm bg-amber-400 text-black px-7 py-4 hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-60">
              Começar agora <ArrowUpRight className="w-4 h-4" />
            </BuyButton>
            <Link
              href={TALK_CTA}
              className="font-display font-bold uppercase tracking-wider text-sm border border-white/15 text-white/80 px-7 py-4 hover:bg-white/[0.04] hover:text-white transition-colors flex items-center gap-2"
            >
              Falar com especialista
            </Link>
          </div>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/40 text-xs font-sans">
            {[
              "7 dias de garantia",
              "Onboarding 1:1 incluído",
              "Cancele quando quiser",
            ].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual mockup */}
        <div className="relative">
          <KanbanMockup />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   MOCKUP: KANBAN (hero)
   ───────────────────────────────────────────────────────────── */
function KanbanMockup() {
  const cols = [
    {
      label: "Aguardando",
      dot: "bg-amber-400",
      tone: "text-amber-300",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      cards: [
        { name: "Lucas A.", plate: "RGB-2A91", value: "189,00" },
        { name: "Marcela P.", plate: "QXR-7B22", value: "320,00" },
      ],
    },
    {
      label: "Em Execução",
      dot: "bg-blue-400",
      tone: "text-blue-300",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      cards: [{ name: "Diego R.", plate: "MZF-4K01", value: "540,00" }],
    },
    {
      label: "Pronto",
      dot: "bg-green-400",
      tone: "text-green-300",
      bg: "bg-green-400/10",
      border: "border-green-400/20",
      cards: [{ name: "Bia S.", plate: "TKL-9N33", value: "260,00" }],
    },
  ];

  return (
    <div className="relative">
      {/* glow */}
      <div className="absolute -inset-6 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative border border-white/[0.08] bg-zinc-900/70 backdrop-blur-md rounded-2xl p-4 shadow-2xl">
        {/* fake window chrome */}
        <div className="flex items-center gap-1.5 mb-4 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="ml-3 font-mono text-[10px] text-white/30 tracking-wider">
            vrumm · orçamentos
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {cols.map((col) => (
            <div key={col.label} className="space-y-2.5">
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded ${col.bg} border ${col.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${col.tone}`}>
                  {col.label}
                </span>
              </div>
              {col.cards.map((c, i) => (
                <div
                  key={i}
                  className="bg-zinc-800/80 border border-white/[0.06] rounded-lg p-2.5"
                >
                  <p className="text-white text-xs font-medium leading-tight">{c.name}</p>
                  <span className="inline-block mt-1.5 font-mono text-[9px] bg-white/[0.06] text-white/60 px-1.5 py-0.5 rounded">
                    {c.plate}
                  </span>
                  <p className="text-green-400 text-[11px] font-bold mt-2">R$ {c.value}</p>
                </div>
              ))}
              {col.cards.length === 0 && (
                <div className="border border-dashed border-white/10 rounded-lg h-12" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* floating notification */}
      <div className="absolute -bottom-4 -right-2 sm:-right-6 bg-zinc-900 border border-amber-400/30 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 max-w-[240px]">
        <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-400/30 flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <p className="text-white text-xs font-semibold leading-tight">Cliente abriu o link</p>
          <p className="text-white/40 text-[10px] mt-0.5">Orçamento #A7F2C1 · há 2 min</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TRUST BAR
   ───────────────────────────────────────────────────────────── */
function TrustBar() {
  const stats = [
    { n: "30s", l: "Pra montar um orçamento" },
    { n: "24h", l: "Pra estar operando" },
    { n: "100%", l: "Dos carros rastreados" },
    { n: "0", l: "Planilhas. Pra sempre." },
  ];

  return (
    <section className="border-y border-white/[0.06] py-8 mb-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center md:text-left">
            <p className="font-display font-black text-3xl md:text-4xl text-white leading-none">
              {s.n}
            </p>
            <p className="font-sans text-white/40 text-xs mt-1.5 uppercase tracking-wider">
              {s.l}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROBLEM
   ───────────────────────────────────────────────────────────── */
function Problem() {
  const items = [
    {
      title: "Orçamento solto no WhatsApp",
      desc: "Cliente lê 'R$ 400' e na hora de pagar fala que era R$ 350. Sem documento, sem assinatura, você perde dinheiro toda semana.",
    },
    {
      title: "Caderno, planilha e memória",
      desc: "Quantos carros do seu Renault Sandero passaram aqui? Qual o último serviço da placa MZF-4K01? Se a resposta é 'preciso ver depois', você já tá perdendo cliente pro vizinho.",
    },
    {
      title: "Cliente perguntando 'tá pronto?'",
      desc: "Três ligações por dia, dois carros chegando ao mesmo tempo, sua equipe sem saber o que prioriza. Nada de status, nada de visão.",
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-2xl mb-12">
        <p className="font-sans text-amber-400 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
          O problema real
        </p>
        <h2
          className="font-display font-black uppercase leading-[0.95] tracking-tight text-white"
          style={{ fontSize: "clamp(38px, 5.5vw, 64px)" }}
        >
          VOCÊ NÃO TÁ PERDENDO
          <br />
          <span className="text-amber-400">POR CAUSA DO SERVIÇO.</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.06]">
        {items.map((it, i) => (
          <div
            key={it.title}
            className="bg-zinc-950 p-7 lg:p-9 hover:bg-zinc-900/40 transition-colors group"
          >
            <div className="flex items-center justify-between mb-5">
              <span className="font-display font-black text-white/15 text-2xl">
                0{i + 1}
              </span>
              <div className="w-9 h-9 rounded-full border border-red-500/20 bg-red-500/[0.06] flex items-center justify-center">
                <X className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <h3 className="font-display font-bold text-white text-lg uppercase tracking-tight mb-3">
              {it.title}
            </h3>
            <p className="font-sans text-white/50 text-sm leading-relaxed">
              {it.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   FEATURES
   ───────────────────────────────────────────────────────────── */
function Features() {
  return (
    <section id="recursos" className="py-20 lg:py-28">
      <div className="max-w-2xl mb-14">
        <p className="font-sans text-amber-400 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
          O que tá dentro
        </p>
        <h2
          className="font-display font-black uppercase leading-[0.95] tracking-tight text-white mb-5"
          style={{ fontSize: "clamp(38px, 5.5vw, 64px)" }}
        >
          MENOS PLANILHA.
          <br />
          <span className="text-amber-400">MAIS CARRO POR DIA.</span>
        </h2>
        <p className="font-sans text-white/50 text-base max-w-lg">
          Quatro coisas que substituem 90% do que você faz hoje no caderno, no
          WhatsApp e na memória.
        </p>
      </div>

      <div className="space-y-px bg-white/[0.06] border border-white/[0.06]">
        <FeatureRow
          n="01"
          icon={Zap}
          title="ORÇAMENTO PROFISSIONAL EM 30 SEGUNDOS"
          desc="Selecione o cliente, adicione os serviços e o orçamento está pronto. Um link público é gerado automaticamente — mande pelo WhatsApp e o cliente abre como um documento sério, com seu logo, CNPJ e endereço."
          bullets={[
            "Link pronto pra WhatsApp",
            "Versão pra imprimir / salvar PDF",
            "Cliente vê em qualquer celular",
          ]}
          mockup={<QuoteMockup />}
        />
        <FeatureRow
          n="02"
          icon={LayoutGrid}
          title="KANBAN DE CARROS NA OFICINA"
          desc="Aguardando aprovação, em execução, pronto pra entrega, entregue. Arraste cada orçamento entre as colunas ou avance com um clique. Quando o cliente liga 'tá pronto?' você responde em 2 segundos."
          bullets={[
            "Arraste-e-solte em qualquer tela",
            "Status financeiro em tempo real",
            "Funciona no celular igual ao desktop",
          ]}
          mockup={<KanbanThumb />}
          reverse
        />
        <FeatureRow
          n="03"
          icon={Car}
          title="PLACA AUTO-COMPLETA VIA FIPE"
          desc="Digite a marca, escolhe modelo, escolhe ano. Tudo via base oficial FIPE. Cada cliente vira histórico — quantos carros, qual a última visita, qual o último serviço. Pra sempre."
          bullets={[
            "Marca, modelo e ano automáticos",
            "Histórico do veículo por cliente",
            "1 cliente → N carros",
          ]}
          mockup={<VehicleMockup />}
        />
        <FeatureRow
          n="04"
          icon={ClipboardCheck}
          title="OBSERVAÇÕES QUE TE PROTEGEM"
          desc="Arranhão no para-choque? Vidro com mancha? Banco com rasgo? Anota antes do serviço e sai no link público que o cliente recebe. Acabou discussão de 'já tava assim?' depois da entrega."
          bullets={[
            "Campo de observação por veículo",
            "Visível no link público do cliente",
            "Você prova o estado antes do serviço",
          ]}
          mockup={<ObservationMockup />}
          reverse
        />
      </div>
    </section>
  );
}

function FeatureRow({
  n,
  icon: Icon,
  title,
  desc,
  bullets,
  mockup,
  reverse,
}: {
  n: string;
  icon: typeof Zap;
  title: string;
  desc: string;
  bullets: string[];
  mockup: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="bg-zinc-950 p-7 lg:p-12">
      <div
        className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
          reverse ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span className="font-display font-black text-amber-400 text-sm tracking-wider">
              {n}
            </span>
            <span className="h-px w-8 bg-amber-400/30" />
            <Icon className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-display font-black text-white text-2xl lg:text-3xl uppercase tracking-tight leading-[1.05] mb-4">
            {title}
          </h3>
          <p className="font-sans text-white/55 text-sm lg:text-base leading-relaxed mb-6">
            {desc}
          </p>
          <ul className="space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-white/70 text-sm font-sans">
                <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">{mockup}</div>
      </div>
    </div>
  );
}

/* ── Mockup: orçamento público ── */
function QuoteMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-amber-500/[0.06] blur-3xl rounded-full pointer-events-none" />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-auto text-gray-900 border border-white/[0.05]">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <VrummIconMark size={22} />
            <div>
              <p className="font-bold text-sm leading-tight">Estética do Lucas</p>
              <p className="text-[10px] text-gray-400">CNPJ 00.000.000/0001-00</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase text-gray-400 tracking-widest">Orçamento</p>
            <p className="font-mono font-bold text-sm">#A7F2C1</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded text-[10px] font-semibold mb-4">
          ● Aguardando aprovação
        </div>

        <div className="border-t border-gray-100 pt-3 mb-3">
          <p className="text-[9px] uppercase text-gray-400 tracking-widest mb-1.5">Cliente</p>
          <p className="text-sm font-semibold">Marcela P.</p>
          <span className="inline-block mt-1 font-mono text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
            QXR-7B22
          </span>
        </div>

        <div className="border-t border-gray-100 pt-3 mb-3">
          <p className="text-[9px] uppercase text-gray-400 tracking-widest mb-2">Serviços</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-600"><span className="text-gray-400">1x</span> Polimento técnico</span><span>R$ 220,00</span></div>
            <div className="flex justify-between"><span className="text-gray-600"><span className="text-gray-400">1x</span> Higienização interna</span><span>R$ 100,00</span></div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
          <span className="text-xs font-semibold">Total</span>
          <span className="text-green-600 font-bold text-lg">R$ 320,00</span>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup: kanban menor ── */
function KanbanThumb() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-blue-500/[0.05] blur-3xl rounded-full pointer-events-none" />
      <div className="relative bg-zinc-900/80 border border-white/[0.06] rounded-xl p-4 grid grid-cols-4 gap-2">
        {[
          { d: "bg-amber-400", n: 4, bg: "bg-amber-400/10", b: "border-amber-400/20", t: "text-amber-300" },
          { d: "bg-blue-400",  n: 2, bg: "bg-blue-400/10",  b: "border-blue-400/20",  t: "text-blue-300"  },
          { d: "bg-green-400", n: 3, bg: "bg-green-400/10", b: "border-green-400/20", t: "text-green-300" },
          { d: "bg-zinc-500",  n: 7, bg: "bg-zinc-700/40",  b: "border-zinc-700",     t: "text-zinc-400"  },
        ].map((c, i) => (
          <div key={i} className="space-y-2">
            <div className={`flex items-center justify-between px-2 py-1.5 rounded ${c.bg} border ${c.b}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.d}`} />
              <span className={`text-[10px] font-bold ${c.t}`}>{c.n}</span>
            </div>
            <div className="h-10 bg-zinc-800/60 border border-white/[0.04] rounded" />
            <div className="h-10 bg-zinc-800/60 border border-white/[0.04] rounded" />
            {i < 3 && <div className="h-10 bg-zinc-800/60 border border-white/[0.04] rounded" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mockup: cadastro de veículo c/ FIPE ── */
function VehicleMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-amber-500/[0.06] blur-3xl rounded-full pointer-events-none" />
      <div className="relative bg-zinc-900/80 border border-white/[0.06] rounded-xl p-5 max-w-sm mx-auto">
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-4">Novo veículo</p>

        <div className="space-y-3">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Placa</p>
            <div className="bg-zinc-800/60 border border-white/[0.06] rounded px-3 py-2 font-mono text-white text-sm">
              MZF-4K01
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Marca</p>
              <div className="bg-zinc-800/60 border border-amber-400/30 rounded px-3 py-2 text-white text-sm flex items-center justify-between">
                Volkswagen
                <Check className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Modelo</p>
              <div className="bg-zinc-800/60 border border-amber-400/30 rounded px-3 py-2 text-white text-sm flex items-center justify-between">
                Polo GTS
                <Check className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Ano</p>
            <div className="bg-zinc-800/60 border border-amber-400/30 rounded px-3 py-2 text-white text-sm flex items-center justify-between">
              2023 — Gasolina
              <Check className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
        </div>

        <p className="text-amber-400/80 text-[10px] mt-4 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Dados puxados da base FIPE
        </p>
      </div>
    </div>
  );
}

/* ── Mockup: observações ── */
function ObservationMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-red-500/[0.04] blur-3xl rounded-full pointer-events-none" />
      <div className="relative bg-zinc-900/80 border border-white/[0.06] rounded-xl p-5 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Observações do veículo</p>
          <span className="bg-amber-400/15 text-amber-400 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">Visível ao cliente</span>
        </div>

        <div className="bg-zinc-800/60 border border-white/[0.06] rounded p-3 space-y-2 text-white/80 text-xs font-sans leading-relaxed">
          <p>· Arranhão de 6cm no para-choque traseiro lado esquerdo.</p>
          <p>· Vidro do passageiro com mancha permanente no canto inferior.</p>
          <p>· Banco do motorista com pequeno rasgo de 2cm na lateral.</p>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center gap-2 text-white/40 text-[10px]">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          Salvo no orçamento — protege contra reclamação pós-entrega.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HOW IT WORKS
   ───────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Você paga",
      desc: "Checkout seguro pelo Stripe. Cartão de crédito ou Pix. Em menos de 2 minutos o pagamento é confirmado.",
    },
    {
      n: "02",
      title: "A gente liga",
      desc: "Em até 24h marcamos sua vídeo-chamada de onboarding. Importamos seus clientes, configuramos seu logo no orçamento e treinamos sua equipe.",
    },
    {
      n: "03",
      title: "Você opera",
      desc: "Sai da chamada com o sistema funcionando. Primeiro orçamento ainda no mesmo dia. Suporte por WhatsApp nos primeiros 30 dias.",
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-2xl mb-14">
        <p className="font-sans text-amber-400 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
          Como funciona
        </p>
        <h2
          className="font-display font-black uppercase leading-[0.95] tracking-tight text-white"
          style={{ fontSize: "clamp(38px, 5.5vw, 64px)" }}
        >
          DE PAGAR ATÉ
          <br />
          <span className="text-amber-400">OPERANDO EM 24H.</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <div key={s.n} className="relative border border-white/[0.07] p-7 lg:p-8">
            <span className="font-display font-black text-amber-400/90 text-5xl lg:text-6xl leading-none block mb-4">
              {s.n}
            </span>
            <h3 className="font-display font-bold text-white text-xl uppercase tracking-tight mb-3">
              {s.title}
            </h3>
            <p className="font-sans text-white/55 text-sm leading-relaxed">{s.desc}</p>

            {i < steps.length - 1 && (
              <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/40" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   PRICING
   ───────────────────────────────────────────────────────────── */
function Pricing() {
  const setup = [
    "Vídeo-chamada de onboarding (1h)",
    "Importação dos clientes e serviços atuais",
    "Configuração do logo e dados no orçamento público",
    "Treinamento da equipe (gravado pra rever)",
    "Suporte prioritário nos primeiros 30 dias",
  ];
  const monthly = [
    "Clientes, veículos e serviços ilimitados",
    "Orçamentos ilimitados com link público",
    "Kanban de status em tempo real",
    "Integração FIPE pra placa automática",
    "Suporte por WhatsApp em horário comercial",
    "Atualizações grátis pra sempre",
  ];

  return (
    <section id="precos" className="py-20 lg:py-28">
      <div className="max-w-2xl mx-auto text-center mb-14">
        <p className="font-sans text-amber-400 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
          Preço
        </p>
        <h2
          className="font-display font-black uppercase leading-[0.95] tracking-tight text-white mb-5"
          style={{ fontSize: "clamp(38px, 5.5vw, 64px)" }}
        >
          UM PLANO.
          <br />
          <span className="text-amber-400">SEM PEGADINHA.</span>
        </h2>
        <p className="font-sans text-white/50 text-base">
          Tudo incluído. Sem limite de orçamentos. Sem upgrade pra liberar
          recurso. Sem fidelidade.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="relative border border-amber-400/30 bg-zinc-900/60 backdrop-blur-sm">
          {/* glow */}
          <div className="absolute -inset-4 bg-amber-500/[0.08] blur-3xl rounded-full pointer-events-none -z-10" />

          {/* Header */}
          <div className="border-b border-white/[0.06] p-8 lg:p-10 text-center">
            <p className="font-sans text-amber-400 text-xs font-semibold uppercase tracking-[0.25em] mb-3">
              Vrumm Completo
            </p>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="font-display font-black text-white" style={{ fontSize: "clamp(50px, 8vw, 88px)" }}>
                R$ 189
              </span>
              <span className="font-sans text-white/50 text-lg">/mês</span>
            </div>
            <p className="font-sans text-white/45 text-sm">
              + R$ 500 únicos de implementação assistida
            </p>
          </div>

          {/* Body */}
          <div className="grid md:grid-cols-2 gap-px bg-white/[0.06]">
            <div className="bg-zinc-900/60 p-7 lg:p-9">
              <p className="font-sans text-white/40 text-[11px] font-semibold uppercase tracking-[0.25em] mb-5">
                R$ 500 — Implementação
              </p>
              <ul className="space-y-3">
                {setup.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-white/80 text-sm font-sans">
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900/60 p-7 lg:p-9">
              <p className="font-sans text-white/40 text-[11px] font-semibold uppercase tracking-[0.25em] mb-5">
                R$ 189/mês — Sistema
              </p>
              <ul className="space-y-3">
                {monthly.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-white/80 text-sm font-sans">
                    <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer / CTA */}
          <div className="border-t border-white/[0.06] p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
              <BuyButton className="flex-1 font-display font-bold uppercase tracking-wider text-sm bg-amber-400 text-black px-7 py-4 hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                Pagar e começar <ArrowUpRight className="w-4 h-4" />
              </BuyButton>
              <Link
                href={TALK_CTA}
                className="font-display font-bold uppercase tracking-wider text-sm border border-white/15 text-white/80 px-7 py-4 hover:bg-white/[0.04] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                Tirar dúvida antes
              </Link>
            </div>

            <div className="flex items-start gap-3 bg-amber-400/[0.05] border border-amber-400/20 px-4 py-3 rounded">
              <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="font-sans text-white/70 text-xs leading-relaxed">
                <span className="text-amber-400 font-semibold">7 dias de garantia.</span>{" "}
                Não gostou? A gente devolve a mensalidade — sem perguntas, sem
                burocracia. (A taxa de setup é mantida porque você já recebeu o
                onboarding completo.)
              </p>
            </div>

            <p className="text-center text-white/30 text-[11px] mt-5">
              Cobrado em reais. Sem fidelidade. Cancele a qualquer momento direto no painel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   SOCIAL PROOF
   ───────────────────────────────────────────────────────────── */
function SocialProof() {
  return (
    <section className="py-20 lg:py-28">
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
        <div>
          <p className="font-sans text-amber-400 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            Pra quem é
          </p>
          <h2
            className="font-display font-black uppercase leading-[0.95] tracking-tight text-white mb-5"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            ESTÉTICA QUE
            <br />
            <span className="text-amber-400">QUER CRESCER.</span>
          </h2>
          <p className="font-sans text-white/55 text-base leading-relaxed mb-7">
            Se sua estética já passa de 20 carros por mês, tem mais de uma
            pessoa atendendo ou começou a perder cliente porque "esqueceu o
            orçamento" — o VRUMM foi feito pra você.
          </p>

          <div className="space-y-3">
            {[
              "Você tem mais de 1 funcionário atendendo",
              "Faz 20+ orçamentos por mês",
              "Tá cansado de planilha, caderno ou WhatsApp solto",
              "Quer cobrar como gente grande, com link e logo",
            ].map((t) => (
              <div key={t} className="flex items-start gap-3 text-white/75 text-sm font-sans">
                <div className="w-5 h-5 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-amber-400" />
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="relative border border-white/[0.08] bg-zinc-900/60 p-8 lg:p-10">
          <div className="absolute -top-3 left-8 bg-amber-400 text-black px-3 py-1 text-[10px] font-display font-bold uppercase tracking-widest">
            Lote inicial
          </div>

          <div className="flex items-center gap-0.5 mb-5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>

          <blockquote className="font-display font-bold text-white text-xl lg:text-2xl uppercase tracking-tight leading-[1.15] mb-6">
            "ANTES DO VRUMM EU PERDIA UM CLIENTE POR MÊS PORQUE ESQUECIA O
            ORÇAMENTO QUE TINHA PASSADO. AGORA TUDO TEM LINK, NÚMERO E DATA.
            FICOU PROFISSIONAL."
          </blockquote>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <span className="font-display font-bold text-amber-400 text-sm">EL</span>
            </div>
            <div>
              <p className="font-sans font-semibold text-white text-sm">Estética parceira</p>
              <p className="font-sans text-white/40 text-xs">Depoimento do beta · 2026</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   FAQ
   ───────────────────────────────────────────────────────────── */
function FAQ() {
  const items = [
    {
      q: "Posso cancelar quando eu quiser?",
      a: "Sim. Sem fidelidade, sem multa. Você cancela direto no painel a qualquer momento e a cobrança para no próximo ciclo. Nos primeiros 7 dias, devolvemos a mensalidade integralmente.",
    },
    {
      q: "E a taxa de setup de R$ 500? Devolve também?",
      a: "Não. O setup paga a vídeo-chamada de onboarding, a importação dos seus dados e a configuração do seu orçamento público — tudo isso já é entregue na primeira semana. A garantia de 7 dias cobre a mensalidade.",
    },
    {
      q: "Funciona no celular?",
      a: "Sim. O VRUMM é totalmente responsivo. Kanban, novo orçamento, cadastro de cliente — tudo funciona no celular igual ao desktop. Sua equipe usa pelo navegador, sem precisar instalar app.",
    },
    {
      q: "Quantos funcionários posso colocar?",
      a: "Por enquanto cada conta tem um administrador. Estamos liberando convite de funcionários ainda este ano. Se você precisa de mais de um login agora, fale com a gente que damos um jeito.",
    },
    {
      q: "Meus dados ficam seguros?",
      a: "Sim. Usamos Supabase (Postgres com criptografia em repouso) e seu acesso é separado de qualquer outra estética por row-level security. Só você vê seus dados.",
    },
    {
      q: "E se eu não souber importar meus clientes?",
      a: "É exatamente por isso que existe a implementação assistida. Você manda sua planilha ou lista de clientes do jeito que tá (até no WhatsApp, se for o caso) e a gente importa pra você.",
    },
    {
      q: "Aceita Pix?",
      a: "Sim. O Stripe Checkout aceita cartão de crédito e Pix. A mensalidade pode ser cobrada no cartão automaticamente todo mês — sem você precisar pagar manualmente.",
    },
    {
      q: "Preciso instalar alguma coisa?",
      a: "Nada. Tudo funciona no navegador. Você abre o link, faz login com Google e tá dentro.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-sans text-amber-400 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            Dúvidas frequentes
          </p>
          <h2
            className="font-display font-black uppercase leading-[0.95] tracking-tight text-white"
            style={{ fontSize: "clamp(38px, 5vw, 56px)" }}
          >
            ANTES DE PAGAR.
          </h2>
        </div>

        <div className="border-t border-white/[0.07]">
          {items.map((item) => (
            <details
              key={item.q}
              className="group border-b border-white/[0.07]"
            >
              <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none hover:bg-white/[0.01] transition-colors">
                <span className="font-display font-bold text-white text-base lg:text-lg uppercase tracking-tight">
                  {item.q}
                </span>
                <ChevronDown className="w-5 h-5 text-amber-400 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="font-sans text-white/55 text-sm leading-relaxed pb-5 pr-9">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-white/40 text-sm font-sans mb-3">Sua dúvida não tá aqui?</p>
          <Link
            href={TALK_CTA}
            className="inline-flex items-center gap-2 font-display font-bold uppercase tracking-wider text-sm border border-white/15 text-white/80 px-6 py-3 hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <Headphones className="w-4 h-4" />
            Falar com um especialista
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   FINAL CTA
   ───────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="relative border border-white/[0.08] p-10 lg:p-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] to-transparent pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="max-w-xl">
            <h2
              className="font-display font-black uppercase leading-[0.95] tracking-tight text-white mb-4"
              style={{ fontSize: "clamp(36px, 5.5vw, 64px)" }}
            >
              PRONTO PRA SAIR
              <br />
              <span className="text-amber-400">DO CADERNO?</span>
            </h2>
            <p className="font-sans text-white/55 text-base leading-relaxed">
              R$ 689 hoje (setup + primeira mensalidade). R$ 189/mês a partir
              do próximo ciclo. 7 dias de garantia, sem fidelidade.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0">
            <BuyButton className="font-display font-bold uppercase tracking-wider text-sm bg-amber-400 text-black px-8 py-4 hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              Pagar e começar <ArrowUpRight className="w-4 h-4" />
            </BuyButton>
            <Link
              href={TALK_CTA}
              className="font-sans text-sm text-white/40 hover:text-white transition-colors text-center underline underline-offset-4"
            >
              Quero falar com alguém antes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────────────────────── */
function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.05] py-10 mt-10">
      <div className="grid md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10 mb-10">
        <div>
          <VrummLogo iconSize={28} textClass="text-base text-white" />
          <p className="font-sans text-white/40 text-xs mt-4 max-w-xs leading-relaxed">
            Gestão pra estéticas automotivas. Da placa ao Pix, sem planilha.
          </p>
        </div>

        <FooterCol
          title="Produto"
          links={[
            { label: "Recursos", href: "#recursos" },
            { label: "Preço", href: "#precos" },
            { label: "FAQ", href: "#faq" },
          ]}
        />
        <FooterCol
          title="Empresa"
          links={[
            { label: "Contato", href: TALK_CTA },
            { label: "Login", href: LOGIN_CTA },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { label: "Termos de uso", href: "#" },
            { label: "Privacidade", href: "#" },
          ]}
        />
      </div>

      <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-sans text-white/25 text-xs">
          © {new Date().getFullYear()} VRUMM · Todos os direitos reservados
        </span>
        <span className="font-sans text-white/25 text-xs">Feito no Brasil 🇧🇷</span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="font-sans font-semibold text-white text-xs uppercase tracking-widest mb-4">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="font-sans text-white/40 text-sm hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
