"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertService(data: {
  id?: string;
  title: string;
  description: string;
  price: number;
  duration_estimated: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado");

  const payload = {
    title: data.title.trim(),
    description: data.description.trim(),
    price: data.price,
    duration_estimated: data.duration_estimated.trim(),
    tenant_id: profile.tenant_id,
  };

  if (data.id) {
    const { error } = await supabase
      .from("services")
      .update(payload)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("services").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/servicos");
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/servicos");
}
