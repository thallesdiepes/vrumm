-- Migration: fecha bypass de pagamento / troca de tenant via anon key
-- Execute INTEIRO no SQL Editor do Supabase DEPOIS do deploy do código
-- (o código novo chama create_tenant_and_profile só com user_full_name,
-- que também funciona com a função antiga — então código primeiro, SQL depois).

-- =============================================
-- 1. profiles: usuário só pode editar o próprio full_name
--    Antes: UPDATE liberado em todas as colunas → dava pra setar
--    is_active = true (pular pagamento) ou trocar tenant_id (ver outra loja).
-- =============================================

REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- =============================================
-- 2. tenants: usuário só pode editar dados cadastrais da loja
--    Colunas de cobrança (subscription_*, stripe_customer_id) só via
--    service_role (webhook / admin client).
-- =============================================

REVOKE INSERT, UPDATE, DELETE ON public.tenants FROM anon, authenticated;
GRANT UPDATE (name, cnpj, address, whatsapp_number, logo_url) ON public.tenants TO authenticated;

DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
CREATE POLICY "tenants_update" ON public.tenants
  FOR UPDATE
  USING (id = public.get_my_tenant_id())
  WITH CHECK (id = public.get_my_tenant_id());


-- =============================================
-- 3. create_tenant_and_profile: sempre cria INATIVO
--    Antes aceitava initial_is_active vindo do cliente — qualquer usuário
--    logado podia chamar a RPC com true. A ativação agora acontece só
--    no servidor (service_role) após confirmar pending_signups.
-- =============================================

DROP FUNCTION IF EXISTS public.create_tenant_and_profile(text, boolean, text);

CREATE OR REPLACE FUNCTION public.create_tenant_and_profile(user_full_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id      uuid;
  existing_tenant_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT tenant_id INTO existing_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF existing_tenant_id IS NOT NULL THEN
    RETURN existing_tenant_id;
  END IF;

  INSERT INTO public.tenants (name)
  VALUES (user_full_name || ' - Estética')
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.profiles (id, tenant_id, full_name, role, is_active)
  VALUES (auth.uid(), new_tenant_id, user_full_name, 'admin', false);

  RETURN new_tenant_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_tenant_and_profile(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_tenant_and_profile(text) TO authenticated;
