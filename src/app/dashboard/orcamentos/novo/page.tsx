import { createClient } from "@/lib/supabase/server";
import { NewQuoteForm } from "@/components/quotes/new-quote-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NovoOrcamentoPage() {
  const supabase = await createClient();
  const [clientsRes, servicesRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, vehicles(id, plate, brand, model, year)")
      .order("name"),
    supabase.from("services").select("id, title, price, duration_estimated").order("title"),
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/dashboard/orcamentos"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-4 w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Novo Orçamento</h1>
      </div>
      <NewQuoteForm
        clients={(clientsRes.data ?? []) as never}
        services={(servicesRes.data ?? []) as { id: string; title: string; price: number; duration_estimated: string | null }[]}
      />
    </div>
  );
}
