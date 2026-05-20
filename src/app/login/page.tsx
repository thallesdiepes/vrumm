"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveLead } from "@/app/actions/leads";
import { ArrowRight, Check } from "lucide-react";
import { VrummLogo } from "@/components/layout/vrumm-logo";

const SALES_WHATSAPP = "5521998258856";

const BENEFITS = [
  "Orçamentos profissionais em segundos",
  "Kanban de ordens de serviço",
  "Link público para o cliente aprovar",
  "Histórico de veículos por cliente",
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const params = useSearchParams();
  const initialMode = params.get("mode") === "login" ? "login" : "lead";
  const [mode, setMode] = useState<"lead" | "login">(initialMode);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });
  const supabase = createClient();

  function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Salva em paralelo — não bloqueia o window.open (evita popup blocker)
    saveLead(form).catch(() => {});

    const text = encodeURIComponent(
      `Olá, queria saber mais sobre a Vrumm. Me chamo ${form.name}.`
    );
    window.open(`https://wa.me/${SALES_WHATSAPP}?text=${text}`, "_blank");
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setLoginError("Não foi possível iniciar o login com Google. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/[0.04] rounded-full blur-[140px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
        <VrummLogo iconSize={28} textClass="text-xl text-white" />
        {mode === "lead" ? (
          <button
            onClick={() => setMode("login")}
            className="font-sans text-xs font-semibold text-black bg-amber-400 hover:bg-amber-300 transition-colors px-4 py-2 uppercase tracking-widest"
          >
            Já sou cliente →
          </button>
        ) : (
          <button
            onClick={() => setMode("lead")}
            className="font-sans text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest"
          >
            ← Voltar
          </button>
        )}
      </nav>

      {/* Conteúdo */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        {mode === "lead" ? (
          /* ── Modo vendas ── */
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">

            {/* Left: pitch */}
            <div>
              <p className="font-sans text-amber-400 text-xs uppercase tracking-[0.2em] mb-4">
                Gestão para estéticas automotivas
              </p>
              <h1
                className="font-display font-black uppercase leading-none text-white mb-6"
                style={{ fontSize: "clamp(40px, 7vw, 64px)" }}
              >
                PROFISSIONALIZE
                <br />
                <span className="text-amber-400">SUA ESTÉTICA.</span>
              </h1>
              <ul className="space-y-3 mb-8">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-white/60 text-sm font-sans">
                    <span className="w-5 h-5 rounded-full bg-amber-400/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-amber-400" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: form */}
            <div className="border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-7">
              <p className="font-display font-black text-xl uppercase tracking-tight mb-1">
                Fale com um especialista
              </p>
              <p className="font-sans text-white/40 text-sm mb-6">
                Deixe seu contato e entraremos em conversa pelo WhatsApp.
              </p>

              <form onSubmit={handleLeadSubmit} className="space-y-3">
                <input
                  required
                  type="text"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 px-4 py-3 text-sm font-sans focus:outline-none focus:border-amber-400/50 transition-colors"
                />
                <input
                  required
                  type="email"
                  placeholder="Seu e-mail"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 px-4 py-3 text-sm font-sans focus:outline-none focus:border-amber-400/50 transition-colors"
                />
                <input
                  required
                  type="tel"
                  placeholder="WhatsApp (ex: 21 99999-9999)"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/25 px-4 py-3 text-sm font-sans focus:outline-none focus:border-amber-400/50 transition-colors"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black font-sans font-bold py-3.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Aguarde..." : (
                    <>
                      Falar com especialista
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="font-sans text-white/20 text-[11px] text-center mt-5">
                Ao continuar, você aceita os termos de uso do Vrumm.
              </p>
            </div>
          </div>
        ) : (
          /* ── Modo login ── */
          <div className="w-full max-w-[360px]">
            <div className="mb-10">
              <h1
                className="font-display font-black uppercase leading-none text-white mb-3"
                style={{ fontSize: "clamp(44px, 10vw, 64px)" }}
              >
                BEM-VINDO
                <br />
                <span className="text-amber-400">DE VOLTA.</span>
              </h1>
              <p className="font-sans text-white/40 text-sm leading-relaxed">
                Entre com sua conta Google para acessar sua estética.
              </p>
            </div>

            <div className="border border-white/[0.07] bg-white/[0.02] p-6 backdrop-blur-sm">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-amber-50 active:bg-amber-100 text-[#080808] font-sans font-semibold py-3.5 px-4 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {loading ? "Redirecionando..." : "Continuar com Google"}
              </button>

              {loginError && (
                <p className="text-red-400 text-xs text-center mt-4">{loginError}</p>
              )}

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="font-sans text-white/20 text-[10px] uppercase tracking-widest">acesso seguro</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <p className="font-sans text-white/25 text-xs text-center leading-relaxed">
                Primeiro acesso? Sua estética é criada automaticamente.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
