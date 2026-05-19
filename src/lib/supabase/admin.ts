import { createClient } from "@supabase/supabase-js";

// Usa service_role — bypassa RLS. Só usar em Server Components/Route Handlers.
// Nunca expor no frontend.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
