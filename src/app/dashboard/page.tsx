import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Wrench, FileText, ArrowRight, TrendingUp, CheckCircle2, Clock } from "lucide-react";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [quotesRes, clientsRes, servicesRes] = await Promise.all([
    supabase.from("quotes").select("status, total_value"),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
  ]);

  const quotes = quotesRes.data ?? [];
  const aguardando = quotes.filter((q) => q.status === "Aguardando Aprovacao").length;
  const emExecucao = quotes.filter((q) => q.status === "Em Execucao").length;
  const prontos    = quotes.filter((q) => q.status === "Pronto").length;

  const totalRecebido  = quotes.filter((q) => q.status === "Entregue").reduce((s, q) => s + Number(q.total_value), 0);
  const totalAReceber  = quotes.filter((q) => q.status === "Pronto").reduce((s, q) => s + Number(q.total_value), 0);
  const totalPrevisao  = quotes.filter((q) => q.status === "Aguardando Aprovacao").reduce((s, q) => s + Number(q.total_value), 0);

  const metrics = [
    { label: "Aguardando aprovação", value: aguardando, color: "text-amber-500" },
    { label: "Em execução agora",    value: emExecucao, color: "text-blue-500"  },
    { label: "Prontos para entrega", value: prontos,    color: "text-green-500" },
  ];

  const financial = [
    {
      label: "Já recebido",
      sub: "Orçamentos entregues",
      value: totalRecebido,
      icon: CheckCircle2,
      valueColor: "text-green-600 dark:text-green-400",
      iconColor: "text-green-500",
      border: "border-green-200 dark:border-green-500/20",
      bg: "bg-green-50 dark:bg-green-500/5",
    },
    {
      label: "A receber",
      sub: "Prontos, aguardando entrega",
      value: totalAReceber,
      icon: Clock,
      valueColor: "text-blue-600 dark:text-blue-400",
      iconColor: "text-blue-500",
      border: "border-blue-200 dark:border-blue-500/20",
      bg: "bg-blue-50 dark:bg-blue-500/5",
    },
    {
      label: "Previsão de ganhos",
      sub: "Aguardando aprovação",
      value: totalPrevisao,
      icon: TrendingUp,
      valueColor: "text-amber-600 dark:text-amber-400",
      iconColor: "text-amber-500",
      border: "border-amber-200 dark:border-amber-500/20",
      bg: "bg-amber-50 dark:bg-amber-500/5",
    },
  ];

  const shortcuts = [
    { href: "/dashboard/clientes",   label: "Clientes",   count: clientsRes.count ?? 0, icon: Users,    sub: "cadastrados" },
    { href: "/dashboard/servicos",   label: "Serviços",   count: servicesRes.count ?? 0, icon: Wrench,   sub: "no catálogo" },
    { href: "/dashboard/orcamentos", label: "Orçamentos", count: quotes.length,          icon: FileText, sub: "no total"    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl uppercase tracking-tight text-gray-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">Visão geral do seu negócio hoje</p>
      </div>

      {/* Financeiro */}
      <section className="mb-8">
        <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">Financeiro</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {financial.map((f) => (
            <div
              key={f.label}
              className={`border rounded-xl p-5 shadow-sm ${f.border} ${f.bg}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <f.icon className={`w-4 h-4 ${f.iconColor}`} />
                <p className="text-gray-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">{f.label}</p>
              </div>
              <p className={`font-display font-black text-2xl sm:text-3xl leading-none ${f.valueColor}`}>
                {brl(f.value)}
              </p>
              <p className="text-gray-400 dark:text-zinc-500 text-xs mt-2">{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status dos orçamentos */}
      <section className="mb-8">
        <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">Status dos orçamentos</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm"
            >
              <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wider mb-3">{m.label}</p>
              <p className={`font-display font-black text-5xl ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Acesso rápido */}
      <section>
        <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">Acesso rápido</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-amber-300 dark:hover:border-amber-500/40 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className="w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-amber-500 transition-colors" />
                  <span className="text-gray-500 dark:text-zinc-400 text-sm font-medium group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors">
                    {s.label}
                  </span>
                </div>
                <p className="font-display font-black text-4xl text-gray-900 dark:text-zinc-100">{s.count}</p>
                <p className="text-gray-400 dark:text-zinc-500 text-xs mt-0.5">{s.sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
