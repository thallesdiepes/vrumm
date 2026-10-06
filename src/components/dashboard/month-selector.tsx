import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, compareMonths, currentMonth, monthKey, monthLabel, type Month } from "@/lib/dashboard/months";

const navBtn =
  "w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors";

/** ← mês → com atalho pro mês corrente. Usado no Dashboard e em Custos. */
export function MonthSelector({ selected, basePath }: { selected: Month; basePath: string }) {
  const current = currentMonth();
  const isCurrent = compareMonths(selected, current) === 0;
  const prev = addMonths(selected, -1);
  const next = addMonths(selected, 1);

  return (
    <div className="flex flex-wrap items-center gap-1 self-start sm:self-auto">
      <Link href={`${basePath}?mes=${monthKey(prev)}`} className={navBtn} aria-label="Mês anterior">
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
        <Link href={`${basePath}?mes=${monthKey(next)}`} className={navBtn} aria-label="Próximo mês">
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
      {/* Atalho pro mês corrente — nomeia o mês pra não ser lido como rótulo do selecionado */}
      {!isCurrent && (
        <Link
          href={basePath}
          className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg px-2.5 py-1.5 transition-colors"
        >
          Voltar para {monthLabel(current)}
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
