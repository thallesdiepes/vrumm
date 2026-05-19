import { createClient } from "@/lib/supabase/server";
import { EditQuoteForm } from "@/components/quotes/edit-quote-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditarOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [quoteRes, servicesRes] = await Promise.all([
    supabase
      .from("quotes")
      .select(`
        id, total_value, vehicle_notes,
        clients(name),
        vehicles(plate, brand, model, year),
        quote_items(service_id, quantity, unit_price, services(id, title, price))
      `)
      .eq("id", id)
      .single(),
    supabase.from("services").select("id, title, price, duration_estimated").order("title"),
  ]);

  if (!quoteRes.data) notFound();

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/dashboard/orcamentos"
          className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 text-sm transition-colors mb-4 w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Editar Orçamento</h1>
        <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">
          Adicione ou remova serviços e ajuste o valor final.
        </p>
      </div>

      <EditQuoteForm
        quote={quoteRes.data as never}
        allServices={(servicesRes.data ?? []) as { id: string; title: string; price: number; duration_estimated: string | null }[]}
      />
    </div>
  );
}
