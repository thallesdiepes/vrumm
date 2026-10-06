import { addMonths, compareMonths, monthOf, monthOfDate, type Month } from "./months";

export type DeliveredQuote = {
  total_value: number | string;
  delivered_at: string;
  quote_items: {
    quantity: number;
    unit_price: number | string;
    services: { title: string } | { title: string }[] | null;
  }[];
};

export type CreatedQuote = { status: string; created_at: string };

export type ExpenseAmount = { amount: number | string; expense_date: string };

export type MonthPoint = { month: Month; revenue: number; delivered: number; costs: number };

export type MonthlyReport = {
  revenue: number;
  prevRevenue: number;
  costs: number;
  prevCosts: number;
  profit: number;
  prevProfit: number;
  margin: number | null; // lucro / faturado; null sem faturamento
  delivered: number;
  ticket: number | null;
  created: number;
  prevCreated: number;
  conversion: number | null; // 0–1; null sem orçamentos criados
  series: MonthPoint[]; // 12 meses, terminando no selecionado
  topServices: { title: string; value: number }[];
};

export const SERIES_LENGTH = 12;

/**
 * Faturado = soma de total_value dos entregues no mês (inclui desconto manual).
 * Conversão = criados no mês que já saíram de "Aguardando Aprovacao".
 * Ranking de serviços = quantidade × preço dos itens dos entregues no mês.
 * Custos = soma dos custos com expense_date no mês. Lucro = faturado − custos.
 */
export function buildMonthlyReport(
  selected: Month,
  delivered: DeliveredQuote[],
  created: CreatedQuote[],
  expenses: ExpenseAmount[] = [],
): MonthlyReport {
  const prev = addMonths(selected, -1);
  const series: MonthPoint[] = Array.from({ length: SERIES_LENGTH }, (_, i) => ({
    month: addMonths(selected, i - (SERIES_LENGTH - 1)),
    revenue: 0,
    delivered: 0,
    costs: 0,
  }));
  const first = series[0].month;

  const byService = new Map<string, number>();

  for (const q of delivered) {
    const m = monthOf(q.delivered_at);
    const idx = compareMonths(m, first);
    if (idx < 0 || idx >= SERIES_LENGTH) continue;
    series[idx].revenue += Number(q.total_value);
    series[idx].delivered += 1;

    if (compareMonths(m, selected) === 0) {
      for (const item of q.quote_items ?? []) {
        const svc = Array.isArray(item.services) ? item.services[0] : item.services;
        const title = svc?.title ?? "Serviço removido";
        byService.set(title, (byService.get(title) ?? 0) + Number(item.unit_price) * item.quantity);
      }
    }
  }

  for (const e of expenses) {
    const idx = compareMonths(monthOfDate(e.expense_date), first);
    if (idx < 0 || idx >= SERIES_LENGTH) continue;
    series[idx].costs += Number(e.amount);
  }

  let createdNow = 0, createdPrev = 0, converted = 0;
  for (const q of created) {
    const m = monthOf(q.created_at);
    if (compareMonths(m, selected) === 0) {
      createdNow += 1;
      if (q.status !== "Aguardando Aprovacao") converted += 1;
    } else if (compareMonths(m, prev) === 0) {
      createdPrev += 1;
    }
  }

  const current = series[SERIES_LENGTH - 1];
  const previous = series[SERIES_LENGTH - 2];

  return {
    revenue: current.revenue,
    prevRevenue: previous.revenue,
    costs: current.costs,
    prevCosts: previous.costs,
    profit: current.revenue - current.costs,
    prevProfit: previous.revenue - previous.costs,
    margin: current.revenue > 0 ? (current.revenue - current.costs) / current.revenue : null,
    delivered: current.delivered,
    ticket: current.delivered > 0 ? current.revenue / current.delivered : null,
    created: createdNow,
    prevCreated: createdPrev,
    conversion: createdNow > 0 ? converted / createdNow : null,
    series,
    topServices: [...byService.entries()]
      .map(([title, value]) => ({ title, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  };
}
