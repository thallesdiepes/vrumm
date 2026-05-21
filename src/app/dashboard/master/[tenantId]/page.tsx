import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChevronLeft } from "lucide-react";
import { MasterTenantClient } from "@/components/master/master-tenant-client";

const MASTER_EMAIL = "thallesmalinidiepes@gmail.com";

export default async function MasterTenantPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== MASTER_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();

  const [{ data: tenant, error: tenantError }, { data: services }] = await Promise.all([
    admin.from("tenants").select("id, name, cnpj, address, whatsapp_number, logo_url").eq("id", tenantId).single(),
    admin.from("services").select("id, title, description, price, duration_estimated").eq("tenant_id", tenantId).order("title"),
  ]);

  if (tenantError || !tenant) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/master"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{tenant.name}</h1>
        <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">
          {services?.length ?? 0} serviço{(services?.length ?? 0) !== 1 ? "s" : ""} cadastrado{(services?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <MasterTenantClient tenant={tenant} services={services ?? []} />
    </div>
  );
}
