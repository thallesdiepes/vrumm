import { createClient } from "@/lib/supabase/server";
import { TenantForm } from "@/components/settings/tenant-form";
import { redirect } from "next/navigation";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, cnpj, address, whatsapp_number")
    .eq("id", profile?.tenant_id)
    .single();

  if (!tenant) redirect("/login");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Configurações</h1>
        <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">
          Dados da sua estética que aparecem nos orçamentos.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-5">Dados da estética</h2>
        <TenantForm tenant={tenant} />
      </div>
    </div>
  );
}
