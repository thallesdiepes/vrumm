import { createClient } from "@/lib/supabase/server";
import { ServicesSection } from "@/components/services/services-section";

export default async function ServicosPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, title, description, price, duration_estimated")
    .order("title", { ascending: true });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Serviços</h1>
        <p className="text-slate-400 text-sm mt-1">
          {services?.length ?? 0} serviço{(services?.length ?? 0) !== 1 ? "s" : ""} no catálogo
        </p>
      </div>
      <ServicesSection initialServices={services ?? []} />
    </div>
  );
}
