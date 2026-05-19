-- =============================================
-- VRUMM — Schema completo
-- Execute inteiro no SQL Editor do Supabase
-- =============================================


-- =============================================
-- 1. TABELAS
-- =============================================

-- Lojas (um tenant = uma estética)
CREATE TABLE public.tenants (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text          NOT NULL,
  logo_url         text,
  cnpj             text,
  address          text,
  whatsapp_number  text,
  created_at       timestamptz   DEFAULT now()
);

-- Perfil do usuário logado (1:1 com auth.users)
CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name   text        NOT NULL,
  role        text        NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'employee')),
  is_active   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Clientes da estética
CREATE TABLE public.clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  phone       text,
  created_at  timestamptz DEFAULT now()
);

-- Veículos por cliente (N veículos por cliente)
CREATE TABLE public.vehicles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id   uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plate       text        NOT NULL,
  brand       text,
  brand_code  text,
  model       text,
  model_code  text,
  year        text,
  created_at  timestamptz DEFAULT now()
);

-- Catálogo de serviços
CREATE TABLE public.services (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title              text          NOT NULL,
  description        text,
  price              decimal(10,2) NOT NULL DEFAULT 0,
  duration_estimated text,
  created_at         timestamptz   DEFAULT now()
);

-- Orçamentos
-- status: 'Aguardando Aprovacao' | 'Em Execucao' | 'Pronto' | 'Entregue'
CREATE TABLE public.quotes (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id      uuid          REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id     uuid          REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status         text          NOT NULL DEFAULT 'Aguardando Aprovacao',
  total_value    decimal(10,2) NOT NULL DEFAULT 0,
  vehicle_notes  text,
  created_at     timestamptz   DEFAULT now()
);

-- Leads da página de vendas
CREATE TABLE public.leads (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  whatsapp   text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Itens do orçamento
CREATE TABLE public.quote_items (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    uuid          NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  service_id  uuid          NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  quantity    int           NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  decimal(10,2) NOT NULL,
  created_at  timestamptz   DEFAULT now()
);


-- =============================================
-- 2. FUNÇÃO AUXILIAR — tenant_id do usuário logado
-- =============================================

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;


-- =============================================
-- 3. ATIVAR RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE public.tenants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items  ENABLE ROW LEVEL SECURITY;


-- =============================================
-- 4. POLÍTICAS RLS
-- =============================================

-- Tenants: vê e edita somente o seu
CREATE POLICY "tenants_select" ON public.tenants
  FOR SELECT USING (id = public.get_my_tenant_id());

CREATE POLICY "tenants_update" ON public.tenants
  FOR UPDATE USING (id = public.get_my_tenant_id());

-- Profiles: vê todos do tenant, edita só o próprio
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Clients: acesso total dentro do tenant
CREATE POLICY "clients_all" ON public.clients
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Vehicles: acesso total dentro do tenant
CREATE POLICY "vehicles_all" ON public.vehicles
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Services: acesso total dentro do tenant
CREATE POLICY "services_all" ON public.services
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Quotes: acesso total dentro do tenant
CREATE POLICY "quotes_all" ON public.quotes
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Quote items: acesso via quote do tenant
CREATE POLICY "quote_items_all" ON public.quote_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.tenant_id = public.get_my_tenant_id()
    )
  );


-- =============================================
-- 5. FUNÇÃO RPC — Cria tenant + profile no primeiro login
-- Chamada pelo /auth/callback
-- Novo usuário entra com is_active = false (aguarda aprovação)
-- =============================================

CREATE OR REPLACE FUNCTION public.create_tenant_and_profile(user_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
    RETURN;
  END IF;

  INSERT INTO public.tenants (name)
  VALUES (user_full_name || ' - Estética')
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.profiles (id, tenant_id, full_name, role, is_active)
  VALUES (auth.uid(), new_tenant_id, user_full_name, 'admin', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant_and_profile(text) TO authenticated;


-- =============================================
-- 6. POLÍTICA RLS PARA A PÁGINA PÚBLICA (/q/[id])
-- Permite leitura sem autenticação via service_role (admin client)
-- =============================================

-- Quotes públicos: leitura anônima permitida (o admin client bypassa RLS)
-- Não é necessária policy extra — createAdminClient usa service_role key
-- que ignora RLS por definição.
