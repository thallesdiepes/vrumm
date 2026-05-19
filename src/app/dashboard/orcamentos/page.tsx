import { createClient } from "@/lib/supabase/server";
import { QuotesBoard } from "@/components/quotes/quotes-board";

export default async function OrcamentosPage() {
  const supabase = await createClient();

  const [quotesRes, tenantRes] = await Promise.all([
    supabase
      .from("quotes")
      .select(`
        id, status, total_value, vehicle_notes, created_at,
        clients(name, phone),
        vehicles(plate, brand, model, year),
        quote_items(id, quantity, unit_price, services(title))
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("tenants")
      .select("name, cnpj, address, whatsapp_number")
      .single(),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Orçamentos</h1>
        <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">
          {quotesRes.data?.length ?? 0} orçamento{(quotesRes.data?.length ?? 0) !== 1 ? "s" : ""} no total
        </p>
      </div>
      <QuotesBoard
        initialQuotes={(quotesRes.data as never) ?? []}
        tenant={tenantRes.data ?? { name: "Minha Estética", cnpj: null, address: null, whatsapp_number: null }}
      />
    </div>
  );
}
