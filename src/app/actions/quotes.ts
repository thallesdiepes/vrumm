"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type NewClientData = {
  name: string;
  phone: string;
};

type NewVehicleData = {
  plate: string;
  brand?: string;
  brandCode?: string;
  model?: string;
  modelCode?: string;
  year?: string;
};

type QuoteItemData = {
  serviceId: string;
  quantity: number;
  unitPrice: number;
};

export async function createQuote(data: {
  clientId?: string;
  vehicleId?: string;
  newClient?: NewClientData;
  newVehicle?: NewVehicleData;
  items: QuoteItemData[];
  vehicleNotes: string;
}): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado");

  const tenantId = profile.tenant_id;
  let clientId = data.clientId;
  let vehicleId = data.vehicleId;

  if (!clientId && data.newClient) {
    const { data: created, error } = await supabase
      .from("clients")
      .insert({ name: data.newClient.name.trim(), phone: data.newClient.phone.trim(), tenant_id: tenantId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    clientId = created.id;
  }

  if (!clientId) throw new Error("Cliente obrigatório");

  if (!vehicleId && data.newVehicle) {
    const v = data.newVehicle;
    const { data: created, error } = await supabase
      .from("vehicles")
      .insert({
        client_id: clientId,
        tenant_id: tenantId,
        plate: v.plate.trim().toUpperCase(),
        brand: v.brand?.trim() || null,
        brand_code: v.brandCode?.trim() || null,
        model: v.model?.trim() || null,
        model_code: v.modelCode?.trim() || null,
        year: v.year?.trim() || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    vehicleId = created.id;
  }

  const totalValue = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      vehicle_id: vehicleId ?? null,
      status: "Aguardando Aprovacao",
      total_value: totalValue,
      vehicle_notes: data.vehicleNotes || null,
    })
    .select("id")
    .single();
  if (qErr) throw new Error(qErr.message);

  const { error: iErr } = await supabase.from("quote_items").insert(
    data.items.map((i) => ({
      quote_id: quote.id,
      service_id: i.serviceId,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }))
  );
  if (iErr) throw new Error(iErr.message);

  revalidatePath("/dashboard/orcamentos");
  return { id: quote.id };
}

export async function updateQuoteStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/orcamentos");
}

export async function updateQuote(data: {
  id: string;
  items: QuoteItemData[];
  totalValue: number;
  vehicleNotes: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  if (data.items.length === 0) throw new Error("Adicione pelo menos um serviço.");

  const { error: delErr } = await supabase
    .from("quote_items")
    .delete()
    .eq("quote_id", data.id);
  if (delErr) throw new Error(delErr.message);

  const { error: insErr } = await supabase.from("quote_items").insert(
    data.items.map((i) => ({
      quote_id: data.id,
      service_id: i.serviceId,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }))
  );
  if (insErr) throw new Error(insErr.message);

  const { error: updErr } = await supabase
    .from("quotes")
    .update({ total_value: data.totalValue, vehicle_notes: data.vehicleNotes || null })
    .eq("id", data.id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath("/dashboard/orcamentos");
}

export async function deleteQuote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/orcamentos");
}
