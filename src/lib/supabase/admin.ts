import { createClient } from "@supabase/supabase-js";

// Usa service_role — bypassa RLS. Só usar em Server Components/Route Handlers.
// Nunca expor no frontend.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Supabase admin client: variável ausente — URL=${!!url} SERVICE_ROLE_KEY=${!!key}`
    );
  }
  return createClient(url, key);
}
