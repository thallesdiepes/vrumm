import Link from "next/link";
import { monthKey, monthLabel, monthShort, compareMonths, type Month } from "@/lib/dashboard/months";
import type { MonthPoint } from "@/lib/dashboard/monthly-report";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

// Topo "redondo" do eixo, sem sobrar muito espaço acima da maior coluna
function niceMax(max: number) {
  if (max <= 0) return 0;
  const mag = 10 ** Math.floor(Math.log10(max));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * mag >= max) ?? 10;
  return step * mag;
}

/**
 * Colunas de faturamento dos últimos 12 meses — forma "ênfase":
 * mês selecionado no acento (âmbar), demais em cinza. Cores validadas
 * (CVD ΔE ≥ 15 claro / ≥ 23 escuro). Cada coluna é um link pro mês,
 * com tooltip no hover/foco; os valores também ficam na tabela abaixo.
 */
export function RevenueChart({ series, selected }: { series: MonthPoint[]; selected: Month }) {
  const top = niceMax(Math.max(...series.map((p) => p.revenue)));

  if (top === 0) {
    return (
      <p className="text-gray-400 dark:text-zinc-500 text-sm py-10 text-center">
        Nenhuma entrega nos últimos 12 meses.
      </p>
    );
  }

  const ticks = [top, top / 2, 0];

  return (
    <div>
      <div className="relative flex">
        {/* Eixo Y */}
        <div className="relative h-44 w-16 pr-2 text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums text-right shrink-0">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 leading-none translate-y-1/2"
              style={{ bottom: `${(t / top) * 100}%` }}
            >
              {brlCompact(t)}
            </span>
          ))}
        </div>

        <div className="relative flex-1 h-44">
          {/* Grade: 3 linhas finas */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 border-t border-gray-100 dark:border-zinc-800"
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end">
            {series.map((p, i) => {
              const isSelected = compareMonths(p.month, selected) === 0;
              const pct = (p.revenue / top) * 100;
              // Nas pontas, ancora o tooltip na borda pra não vazar do card
              const tipPos = i < 2 ? "left-0" : i >= series.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2";
              return (
                <Link
                  key={monthKey(p.month)}
                  href={`/dashboard?mes=${monthKey(p.month)}`}
                  aria-label={`${monthLabel(p.month)}: ${brl(p.revenue)}, ${p.delivered} entregues`}
                  className="group relative flex-1 h-full flex items-end justify-center px-[1px] outline-none"
                >
                  <span
                    className={`block w-full max-w-[24px] rounded-t-[4px] transition-opacity group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-amber-500 ${
                      isSelected ? "bg-amber-600 dark:bg-amber-500" : "bg-zinc-400 dark:bg-zinc-500"
                    }`}
                    style={{ height: p.revenue > 0 ? `max(${pct}%, 2px)` : "0" }}
                  />
                  {/* Tooltip */}
                  <span className={`pointer-events-none absolute bottom-full mb-1 ${tipPos} z-10 hidden group-hover:block group-focus-visible:block whitespace-nowrap rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs shadow-lg`}>
                    <span className="block text-gray-500 dark:text-zinc-400 capitalize">{monthLabel(p.month)}</span>
                    <span className="block font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">{brl(p.revenue)}</span>
                    <span className="block text-gray-400 dark:text-zinc-500">{p.delivered} entregue{p.delivered !== 1 ? "s" : ""}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Eixo X */}
      <div className="flex pl-16">
        {series.map((p) => {
          const isSelected = compareMonths(p.month, selected) === 0;
          return (
            <span
              key={monthKey(p.month)}
              className={`flex-1 text-center text-[10px] mt-1.5 ${
                isSelected ? "font-semibold text-gray-700 dark:text-zinc-200" : "text-gray-400 dark:text-zinc-500"
              }`}
            >
              {monthShort(p.month)}
            </span>
          );
        })}
      </div>

      {/* Tabela — mesmos valores sem depender de hover/cor */}
      <details className="mt-4 group/details">
        <summary className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 cursor-pointer select-none w-fit">
          Ver em tabela
        </summary>
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-left text-xs text-gray-400 dark:text-zinc-500 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-1.5 font-medium">Mês</th>
              <th className="py-1.5 font-medium text-right">Entregues</th>
              <th className="py-1.5 font-medium text-right">Faturado</th>
            </tr>
          </thead>
          <tbody>
            {[...series].reverse().map((p) => (
              <tr key={monthKey(p.month)} className="border-b border-gray-50 dark:border-zinc-800/50">
                <td className="py-1.5 capitalize text-gray-700 dark:text-zinc-300">{monthLabel(p.month)}</td>
                <td className="py-1.5 text-right tabular-nums text-gray-500 dark:text-zinc-400">{p.delivered}</td>
                <td className="py-1.5 text-right tabular-nums text-gray-900 dark:text-zinc-100">{brl(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
