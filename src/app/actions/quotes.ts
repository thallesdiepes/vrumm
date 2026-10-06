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

function itemsPayload(items: QuoteItemData[]) {
  return items.map((i) => ({
    service_id: i.serviceId,
    quantity: i.quantity,
    unit_price: i.unitPrice,
  }));
}

// Cliente/veículo novos + orçamento + itens numa única transação
// (função create_quote — supabase/migration_quote_rpcs.sql)
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

  const v = data.newVehicle;
  const { data: quoteId, error } = await supabase.rpc("create_quote", {
    p_client_id: data.clientId ?? null,
    p_vehicle_id: data.vehicleId ?? null,
    p_new_client: data.clientId ? null : data.newClient ?? null,
    p_new_vehicle: data.vehicleId || !v
      ? null
      : {
          plate: v.plate,
          brand: v.brand ?? null,
          brand_code: v.brandCode ?? null,
          model: v.model ?? null,
          model_code: v.modelCode ?? null,
          year: v.year ?? null,
        },
    p_items: itemsPayload(data.items),
    p_vehicle_notes: data.vehicleNotes,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/orcamentos");
  return { id: quoteId as string };
}

export async function updateQuoteStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/orcamentos");
}

// Substitui itens + total + observações numa única transação
// (função update_quote — supabase/migration_quote_rpcs.sql)
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

  const { error } = await supabase.rpc("update_quote", {
    p_quote_id: data.id,
    p_items: itemsPayload(data.items),
    p_total: data.totalValue,
    p_vehicle_notes: data.vehicleNotes,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/orcamentos");
}

export async function deleteQuote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/orcamentos");
}
