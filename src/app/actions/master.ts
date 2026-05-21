"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const MASTER_EMAIL = "thallesmalinidiepes@gmail.com";

async function assertMaster() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== MASTER_EMAIL) throw new Error("Acesso não autorizado");
}

export async function masterUpdateTenant(tenantId: string, data: {
  name: string;
  cnpj: string | null;
  address: string | null;
  whatsapp_number: string | null;
  logo_url: string | null;
}) {
  await assertMaster();
  const admin = createAdminClient();
  const { error } = await admin.from("tenants").update(data).eq("id", tenantId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/master/${tenantId}`);
}

export async function masterCreateService(tenantId: string, data: {
  title: string;
  description: string | null;
  price: number;
  duration_estimated: string | null;
}) {
  await assertMaster();
  const admin = createAdminClient();
  const { error } = await admin.from("services").insert({ ...data, tenant_id: tenantId });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/master/${tenantId}`);
}

export async function masterUpdateService(serviceId: string, tenantId: string, data: {
  title: string;
  description: string | null;
  price: number;
  duration_estimated: string | null;
}) {
  await assertMaster();
  const admin = createAdminClient();
  const { error } = await admin.from("services").update(data).eq("id", serviceId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/master/${tenantId}`);
}

export async function masterDeleteService(serviceId: string, tenantId: string) {
  await assertMaster();
  const admin = createAdminClient();
  const { error } = await admin.from("services").delete().eq("id", serviceId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/master/${tenantId}`);
}

export async function masterImportServices(tenantId: string, csvText: string): Promise<number> {
  await assertMaster();
  const admin = createAdminClient();

  const lines = csvText.trim().split("\n").slice(1);
  const services = lines
    .map((line) => {
      const cols = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      const [title, description, price, duration_estimated] = cols;
      return {
        tenant_id: tenantId,
        title: title ?? "",
        description: description || null,
        price: parseFloat(price ?? "0") || 0,
        duration_estimated: duration_estimated || null,
      };
    })
    .filter((s) => s.title);

  if (services.length === 0) throw new Error("Nenhum serviço válido encontrado no CSV.");

  const { error } = await admin.from("services").insert(services);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/master/${tenantId}`);
  return services.length;
}
