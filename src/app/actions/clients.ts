"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getTenantId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado");
  return { supabase, tenantId: profile.tenant_id };
}

export async function upsertClient(data: {
  id?: string;
  name: string;
  phone: string;
}) {
  const { supabase, tenantId } = await getTenantId();

  const payload = {
    name: data.name.trim(),
    phone: data.phone.trim(),
    tenant_id: tenantId,
  };

  if (data.id) {
    const { error } = await supabase.from("clients").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("clients").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/clientes");
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/clientes");
}

export async function upsertVehicle(data: {
  id?: string;
  clientId: string;
  plate: string;
  brand?: string;
  brandCode?: string;
  model?: string;
  modelCode?: string;
  year?: string;
}) {
  const { supabase, tenantId } = await getTenantId();

  const payload = {
    client_id: data.clientId,
    tenant_id: tenantId,
    plate: data.plate.trim().toUpperCase(),
    brand: data.brand?.trim() || null,
    brand_code: data.brandCode?.trim() || null,
    model: data.model?.trim() || null,
    model_code: data.modelCode?.trim() || null,
    year: data.year?.trim() || null,
  };

  if (data.id) {
    const { error } = await supabase.from("vehicles").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("vehicles").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/clientes");
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/clientes");
}
