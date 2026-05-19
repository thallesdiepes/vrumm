import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      try {
        await ensureProfileExists(supabase);
        return NextResponse.redirect(`${origin}${next}`);
      } catch {
        return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

async function ensureProfileExists(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (profile) return;

  const { error } = await supabase.rpc("create_tenant_and_profile", {
    user_full_name: user.user_metadata?.full_name ?? user.email ?? "Usuário",
  });

  if (error) {
    // Log para monitoramento — o usuário será redirecionado e verá tela vazia
    // em vez de crash silencioso sem tenant
    console.error("[auth/callback] Falha ao criar perfil:", error.message);
    throw new Error("Falha ao criar perfil do usuário.");
  }
}
