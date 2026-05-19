import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { VrummLogo } from "@/components/layout/vrumm-logo";

export default async function AguardandoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single();

  if (profile?.is_active) redirect("/dashboard");

  async function handleLogout() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <VrummLogo iconSize={36} textClass="text-2xl text-white" />
        </div>

        <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        <h1 className="font-display font-black text-3xl uppercase tracking-tight mb-3">
          Acesso <span className="text-amber-400">pendente</span>
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Sua conta foi criada com sucesso. Assim que o acesso for liberado,
          você poderá entrar no painel normalmente.
        </p>

        <p className="text-white/30 text-xs mb-8">
          Logado como <span className="text-white/50">{user.email}</span>
        </p>

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
