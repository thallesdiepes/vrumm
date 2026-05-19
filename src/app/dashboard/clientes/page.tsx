import { createClient } from "@/lib/supabase/server";
import { ClientsSection } from "@/components/clients/clients-section";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone, vehicles(id, plate, brand, brand_code, model, model_code, year)")
    .order("name");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Clientes</h1>
        <p className="text-slate-400 text-sm mt-1">
          {clients?.length ?? 0} cliente{(clients?.length ?? 0) !== 1 ? "s" : ""} cadastrado{(clients?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>
      <ClientsSection initialClients={(clients ?? []) as never} />
    </div>
  );
}
