// Meses do dashboard no fuso de São Paulo.
// Brasília é UTC-3 fixo (sem horário de verão desde 2019), então meia-noite
// local = 03:00 UTC. Usamos offset fixo em vez de Intl pra manter a conta simples.
const SP_OFFSET_HOURS = 3;

export type Month = { year: number; month: number }; // month: 1–12

const NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function currentMonth(now: Date = new Date()): Month {
  const local = new Date(now.getTime() - SP_OFFSET_HOURS * 3600_000);
  return { year: local.getUTCFullYear(), month: local.getUTCMonth() + 1 };
}

export function addMonths({ year, month }: Month, n: number): Month {
  const idx = year * 12 + (month - 1) + n;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function compareMonths(a: Month, b: Month): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function monthKey({ year, month }: Month): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Lê ?mes=YYYY-MM. Inválido ou no futuro → mês atual. */
export function parseMonthParam(param: string | undefined, now: Date = new Date()): Month {
  const current = currentMonth(now);
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(param ?? "");
  if (!m) return current;
  const parsed = { year: Number(m[1]), month: Number(m[2]) };
  return compareMonths(parsed, current) > 0 ? current : parsed;
}

/** Início do mês (00:00 em São Paulo) como ISO UTC. */
export function monthStartISO({ year, month }: Month): string {
  return new Date(Date.UTC(year, month - 1, 1, SP_OFFSET_HOURS)).toISOString();
}

/** Mês (em São Paulo) a que um timestamp pertence. */
export function monthOf(timestamp: string): Month {
  return currentMonth(new Date(timestamp));
}

export function monthLabel({ year, month }: Month): string {
  return `${NAMES[month - 1]} ${year}`;
}

export function monthShort({ month }: Month): string {
  return NAMES[month - 1].slice(0, 3);
}
