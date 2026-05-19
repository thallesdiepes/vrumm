"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTenant(data: {
  name: string;
  cnpj: string;
  address: string;
  whatsapp_number: string;
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

  const { error } = await supabase
    .from("tenants")
    .update({
      name: data.name.trim(),
      cnpj: data.cnpj.trim() || null,
      address: data.address.trim() || null,
      whatsapp_number: data.whatsapp_number.trim() || null,
    })
    .eq("id", profile.tenant_id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/configuracoes");
}
