import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Wrench, FileText, ArrowRight, TrendingUp, Clock,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  addMonths, compareMonths, currentMonth, monthKey, monthLabel, monthStartISO, parseMonthParam,
} from "@/lib/dashboard/months";
import {
  buildMonthlyReport, SERIES_LENGTH, type CreatedQuote, type DeliveredQuote,
} from "@/lib/dashboard/monthly-report";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Supabase devolve no máximo 1000 linhas por consulta — pagina até acabar.
const PAGE = 1000;
async function fetchAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

function Delta({ current, previous, kind }: { current: number; previous: number; kind: "percent" | "absolute" }) {
  if (previous === 0 && current === 0) return <span className="text-gray-400 dark:text-zinc-500">igual ao mês anterior</span>;
  if (kind === "percent" && previous === 0) return <span className="text-gray-400 dark:text-zinc-500">sem faturamento no mês anterior</span>;

  const diff = current - previous;
  if (diff === 0) return <span className="text-gray-400 dark:text-zinc-500">igual ao mês anterior</span>;

  const up = diff > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  const text = kind === "percent"
    ? `${Math.abs(Math.round((diff / previous) * 100))}%`
    : `${Math.abs(diff)}`;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium ${up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
      <Icon className="w-3 h-3" />
      {text}
      <span className="font-normal text-gray-400 dark:text-zinc-500 ml-1">vs mês anterior</span>
    </span>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { mes } = await searchParams;
  const selected = parseMonthParam(mes);
  const isCurrent = compareMonths(selected, currentMonth()) === 0;
  const prevMonth = addMonths(selected, -1);
  const nextMonth = addMonths(selected, 1);

  const windowStart = monthStartISO(addMonths(selected, -(SERIES_LENGTH - 1)));
  const selectedEnd = monthStartISO(nextMonth);

  const [delivered, created, openRes, clientsRes, servicesRes, quotesCountRes] = await Promise.all([
    fetchAll<DeliveredQuote>((from, to) =>
      supabase
        .from("quotes")
        .select("total_value, delivered_at, quote_items(quantity, unit_price, services(title))")
        .gte("delivered_at", windowStart)
        .lt("delivered_at", selectedEnd)
        .order("delivered_at")
        .order("id")
        .range(from, to)
    ),
    fetchAll<CreatedQuote>((from, to) =>
      supabase
        .from("quotes")
        .select("status, created_at")
        .gte("created_at", monthStartISO(prevMonth))
        .lt("created_at", selectedEnd)
        .order("created_at")
        .order("id")
        .range(from, to)
    ),
    // Situação atual (não depende do mês)
    supabase
      .from("quotes")
      .select("status, total_value")
      .in("status", ["Aguardando Aprovacao", "Em Execucao", "Pronto"]),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("quotes").select("id", { count: "exact", head: true }),
  ]);

  const report = buildMonthlyReport(selected, delivered, created);

  const open = openRes.data ?? [];
  const aguardando = open.filter((q) => q.status === "Aguardando Aprovacao");
  const emExecucao = open.filter((q) => q.status === "Em Execucao");
  const prontos    = open.filter((q) => q.status === "Pronto");
  const sum = (qs: { total_value: number }[]) => qs.reduce((s, q) => s + Number(q.total_value), 0);

  const now = [
    {
      label: "A receber",
      sub: `${prontos.length} pronto${prontos.length !== 1 ? "s" : ""}, aguardando entrega`,
      value: sum(prontos),
      icon: Clock,
      valueColor: "text-blue-600 dark:text-blue-400",
      iconColor: "text-blue-500",
      border: "border-blue-200 dark:border-blue-500/20",
      bg: "bg-blue-50 dark:bg-blue-500/5",
    },
    {
      label: "Previsão de ganhos",
      sub: `${aguardando.length} aguardando aprovação`,
      value: sum(aguardando),
      icon: TrendingUp,
      valueColor: "text-amber-600 dark:text-amber-400",
      iconColor: "text-amber-500",
      border: "border-amber-200 dark:border-amber-500/20",
      bg: "bg-amber-50 dark:bg-amber-500/5",
    },
  ];

  const metrics = [
    { label: "Aguardando aprovação", value: aguardando.length, color: "text-amber-500" },
    { label: "Em execução agora",    value: emExecucao.length, color: "text-blue-500"  },
    { label: "Prontos para entrega", value: prontos.length,    color: "text-green-500" },
  ];

  const shortcuts = [
    { href: "/dashboard/clientes",   label: "Clientes",   count: clientsRes.count ?? 0,     icon: Users,    sub: "cadastrados" },
    { href: "/dashboard/servicos",   label: "Serviços",   count: servicesRes.count ?? 0,    icon: Wrench,   sub: "no catálogo" },
    { href: "/dashboard/orcamentos", label: "Orçamentos", count: quotesCountRes.count ?? 0, icon: FileText, sub: "no total"    },
  ];

  const tileCls = "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm";
  const tileLabel = "text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wider mb-3";
  const navBtn = "w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight text-gray-900 dark:text-zinc-100">
            Dashboard
          </h1>
          <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">Resultado do mês e situação atual</p>
        </div>

        {/* Seletor de mês */}
        <div className="flex items-center gap-1 self-start sm:self-auto">
          <Link href={`/dashboard?mes=${monthKey(prevMonth)}`} className={navBtn} aria-label="Mês anterior">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="min-w-36 text-center font-display font-bold uppercase tracking-wide text-gray-900 dark:text-zinc-100">
            {monthLabel(selected)}
          </span>
          {isCurrent ? (
            <span className={`${navBtn} opacity-30 pointer-events-none`} aria-hidden>
              <ChevronRight className="w-4 h-4" />
            </span>
          ) : (
            <Link href={`/dashboard?mes=${monthKey(nextMonth)}`} className={navBtn} aria-label="Próximo mês">
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
          {!isCurrent && (
            <Link href="/dashboard" className="ml-2 text-xs text-amber-600 dark:text-amber-400 hover:underline">
              Mês atual
            </Link>
          )}
        </div>
      </div>

      {/* Resultado do mês */}
      <section className="mb-8">
        <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">Resultado do mês</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${tileCls} col-span-2 lg:col-span-1 border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5`}>
            <p className={tileLabel}>Faturado</p>
            <p className="font-display font-black text-3xl leading-none text-green-600 dark:text-green-400 tabular-nums">
              {brl(report.revenue)}
            </p>
            <p className="text-xs mt-2">
              <Delta current={report.revenue} previous={report.prevRevenue} kind="percent" />
            </p>
          </div>
          <div className={tileCls}>
            <p className={tileLabel}>Orçamentos criados</p>
            <p className="font-display font-black text-3xl leading-none text-gray-900 dark:text-zinc-100 tabular-nums">
              {report.created}
            </p>
            <p className="text-xs mt-2">
              <Delta current={report.created} previous={report.prevCreated} kind="absolute" />
            </p>
          </div>
          <div className={tileCls}>
            <p className={tileLabel}>Ticket médio</p>
            <p className="font-display font-black text-3xl leading-none text-gray-900 dark:text-zinc-100 tabular-nums">
              {report.ticket === null ? "—" : brl(report.ticket)}
            </p>
            <p className="text-xs mt-2 text-gray-400 dark:text-zinc-500">
              {report.delivered} entrega{report.delivered !== 1 ? "s" : ""} no mês
            </p>
          </div>
          <div className={`${tileCls} col-span-2 lg:col-span-1`}>
            <p className={tileLabel}>Conversão</p>
            <p className="font-display font-black text-3xl leading-none text-gray-900 dark:text-zinc-100 tabular-nums">
              {report.conversion === null ? "—" : `${Math.round(report.conversion * 100)}%`}
            </p>
            <p className="text-xs mt-2 text-gray-400 dark:text-zinc-500">dos criados no mês já aprovados</p>
          </div>
        </div>
      </section>

      {/* Histórico + ranking */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${tileCls} lg:col-span-2`}>
          <p className="text-gray-900 dark:text-zinc-100 text-sm font-semibold">Faturamento — últimos 12 meses</p>
          <p className="text-gray-400 dark:text-zinc-500 text-xs mb-5">Clique numa coluna para ver o mês</p>
          <RevenueChart series={report.series} selected={selected} />
        </div>

        <div className={tileCls}>
          <p className="text-gray-900 dark:text-zinc-100 text-sm font-semibold">Serviços que mais faturaram</p>
          <p className="text-gray-400 dark:text-zinc-500 text-xs mb-4 capitalize">{monthLabel(selected)}</p>
          {report.topServices.length === 0 ? (
            <p className="text-gray-400 dark:text-zinc-500 text-sm py-6 text-center">Nenhuma entrega no mês.</p>
          ) : (
            <ol className="space-y-3">
              {report.topServices.map((s, i) => (
                <li key={s.title} className="flex items-baseline gap-2 text-sm">
                  <span className="text-gray-400 dark:text-zinc-500 tabular-nums w-4 shrink-0">{i + 1}.</span>
                  <span className="flex-1 min-w-0 truncate text-gray-700 dark:text-zinc-300">{s.title}</span>
                  <span className="font-medium text-gray-900 dark:text-zinc-100 tabular-nums shrink-0">{brl(s.value)}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-4 leading-relaxed">
            Valor dos itens, sem descontos aplicados no total do orçamento.
          </p>
        </div>
      </section>

      {/* Situação atual */}
      <section className="mb-8">
        <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-[0.2em] mb-3">Agora</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {now.map((f) => (
            <div key={f.label} className={`border rounded-xl p-5 shadow-sm ${f.border} ${f.bg}`}>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className={tileCls}>
              <p className={tileLabel}>{m.label}</p>
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
