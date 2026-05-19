"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function saveLead(data: { name: string; email: string; whatsapp: string }) {
  const supabase = createAdminClient();
  await supabase.from("leads").insert({
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    whatsapp: data.whatsapp.replace(/\D/g, ""),
  });
  // Não lança erro — o redirecionamento pro WhatsApp acontece de qualquer forma
}
