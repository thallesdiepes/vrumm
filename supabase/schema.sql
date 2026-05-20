-- =============================================
-- VRUMM — Schema completo
-- Execute inteiro no SQL Editor do Supabase
-- =============================================


-- =============================================
-- 1. TABELAS
-- =============================================

-- Lojas (um tenant = uma estética)
CREATE TABLE IF NOT EXISTS public.tenants (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text          NOT NULL,
  logo_url              text,
  cnpj                  text,
  address               text,
  whatsapp_number       text,
  -- Stripe (preenchidos via webhook após pagamento)
  stripe_customer_id    text          UNIQUE,
  subscription_id       text,
  subscription_status   text          NOT NULL DEFAULT 'inactive'
                                      CHECK (subscription_status IN
                                            ('inactive', 'active', 'past_due', 'canceled', 'incomplete')),
  created_at            timestamptz   DEFAULT now()
);

-- Perfil do usuário logado (1:1 com auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name   text        NOT NULL,
  role        text        NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'employee')),
  is_active   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Clientes da estética
CREATE TABLE IF NOT EXISTS public.clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  phone       text,
  created_at  timestamptz DEFAULT now()
);

-- Veículos por cliente (N veículos por cliente)
CREATE TABLE IF NOT EXISTS public.vehicles (
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
CREATE TABLE IF NOT EXISTS public.services (
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
CREATE TABLE IF NOT EXISTS public.quotes (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id      uuid          REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id     uuid          REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status         text          NOT NULL DEFAULT 'Aguardando Aprovacao',
  total_value    decimal(10,2) NOT NULL DEFAULT 0,
  vehicle_notes  text,
  created_at     timestamptz   DEFAULT now()
);

-- Itens do orçamento
CREATE TABLE IF NOT EXISTS public.quote_items (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    uuid          NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  service_id  uuid          NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  quantity    int           NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  decimal(10,2) NOT NULL,
  created_at  timestamptz   DEFAULT now()
);

-- Leads capturados no formulário público da landing/login
-- Acessada apenas via admin client (createAdminClient) — RLS sem policies bloqueia tudo
CREATE TABLE IF NOT EXISTS public.leads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  email       text        NOT NULL,
  whatsapp    text,
  source      text        DEFAULT 'landing',
  created_at  timestamptz DEFAULT now()
);

-- Pagamentos pendentes — ponte entre Stripe Checkout e o login Google
-- Webhook insere com status 'paid'; /auth/callback consome ao criar tenant
CREATE TABLE IF NOT EXISTS public.pending_signups (
  email                text         PRIMARY KEY,
  stripe_customer_id   text         NOT NULL,
  stripe_session_id    text         NOT NULL,
  status               text         NOT NULL DEFAULT 'paid'
                                    CHECK (status IN ('paid', 'consumed', 'expired')),
  paid_at              timestamptz  DEFAULT now(),
  consumed_at          timestamptz,
  metadata             jsonb,
  created_at           timestamptz  DEFAULT now()
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

ALTER TABLE public.tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups  ENABLE ROW LEVEL SECURITY;


-- =============================================
-- 4. POLÍTICAS RLS
-- =============================================

-- Tenants: vê e edita somente o seu
DROP POLICY IF EXISTS "tenants_select" ON public.tenants;
CREATE POLICY "tenants_select" ON public.tenants
  FOR SELECT USING (id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "tenants_update" ON public.tenants;
CREATE POLICY "tenants_update" ON public.tenants
  FOR UPDATE USING (id = public.get_my_tenant_id());

-- Profiles: vê todos do tenant, edita só o próprio
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Clients: acesso total dentro do tenant
DROP POLICY IF EXISTS "clients_all" ON public.clients;
CREATE POLICY "clients_all" ON public.clients
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Vehicles: acesso total dentro do tenant
DROP POLICY IF EXISTS "vehicles_all" ON public.vehicles;
CREATE POLICY "vehicles_all" ON public.vehicles
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Services: acesso total dentro do tenant
DROP POLICY IF EXISTS "services_all" ON public.services;
CREATE POLICY "services_all" ON public.services
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Quotes: acesso total dentro do tenant
DROP POLICY IF EXISTS "quotes_all" ON public.quotes;
CREATE POLICY "quotes_all" ON public.quotes
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- Quote items: acesso via quote do tenant
DROP POLICY IF EXISTS "quote_items_all" ON public.quote_items;
CREATE POLICY "quote_items_all" ON public.quote_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.tenant_id = public.get_my_tenant_id()
    )
  );

-- Leads e pending_signups: SEM policies de leitura/escrita pra usuários autenticados.
-- Só são acessadas via createAdminClient (service_role) que bypassa RLS por design.


-- =============================================
-- 5. FUNÇÃO RPC — Cria tenant + profile no primeiro login
-- Chamada pelo /auth/callback
--
-- Comportamento:
--  • initial_is_active = false (padrão)  → conta entra em "aguardando aprovação"
--    (usado pra fluxos que não passaram pelo Stripe)
--  • initial_is_active = true            → conta ativa imediatamente
--    (usado depois que pending_signups confirma pagamento via webhook)
--
-- Idempotente: se o profile já existe, retorna o tenant atual sem recriar.
-- =============================================

CREATE OR REPLACE FUNCTION public.create_tenant_and_profile(
  user_full_name             text,
  initial_is_active          boolean DEFAULT false,
  initial_stripe_customer_id text    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id      uuid;
  existing_tenant_id uuid;
  initial_sub_status text;
BEGIN
  -- Idempotente: se já existe profile, devolve o tenant atual
  SELECT tenant_id INTO existing_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF existing_tenant_id IS NOT NULL THEN
    RETURN existing_tenant_id;
  END IF;

  -- Subscription começa 'active' se veio do Stripe, 'inactive' caso contrário
  initial_sub_status := CASE WHEN initial_is_active THEN 'active' ELSE 'inactive' END;

  INSERT INTO public.tenants (name, stripe_customer_id, subscription_status)
  VALUES (
    user_full_name || ' - Estética',
    initial_stripe_customer_id,
    initial_sub_status
  )
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.profiles (id, tenant_id, full_name, role, is_active)
  VALUES (auth.uid(), new_tenant_id, user_full_name, 'admin', initial_is_active);

  RETURN new_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_tenant_and_profile(text, boolean, text) TO authenticated;


-- =============================================
-- 6. POLÍTICA RLS PARA A PÁGINA PÚBLICA (/q/[id])
-- Permite leitura sem autenticação via service_role (admin client)
-- =============================================

-- Quotes públicos: leitura anônima permitida (o admin client bypassa RLS)
-- Não é necessária policy extra — createAdminClient usa service_role key
-- que ignora RLS por definição.
