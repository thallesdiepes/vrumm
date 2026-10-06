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
  delivered_at   timestamptz,  -- preenchido pelo trigger quotes_set_delivered_at
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
  FOR UPDATE
  USING (id = public.get_my_tenant_id())
  WITH CHECK (id = public.get_my_tenant_id());

-- Profiles: vê todos do tenant, edita só o próprio
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Privilégios por coluna: usuário edita só dados cadastrais.
-- is_active, tenant_id, subscription_*, stripe_customer_id → só service_role.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.tenants FROM anon, authenticated;
GRANT UPDATE (name, cnpj, address, whatsapp_number, logo_url) ON public.tenants TO authenticated;

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
-- Chamada pelo /auth/callback. Sempre cria INATIVO — a ativação acontece
-- só no servidor (service_role) via src/lib/billing/claim-pending-signup.ts,
-- depois de confirmar o pagamento em pending_signups.
-- Idempotente: se o profile já existe, retorna o tenant atual sem recriar.
-- =============================================

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


-- =============================================
-- 6. POLÍTICA RLS PARA A PÁGINA PÚBLICA (/q/[id])
-- Permite leitura sem autenticação via service_role (admin client)
-- =============================================

-- Quotes públicos: leitura anônima permitida (o admin client bypassa RLS)
-- Não é necessária policy extra — createAdminClient usa service_role key
-- que ignora RLS por definição.


-- =============================================
-- 7. FUNÇÕES RPC — criação/edição de orçamento atômicas
-- Chamadas por createQuote/updateQuote (src/app/actions/quotes.ts).
-- SECURITY INVOKER: RLS continua valendo.
-- =============================================
-- =============================================
-- Validação comum dos itens: [{service_id, quantity, unit_price}]
-- =============================================

CREATE OR REPLACE FUNCTION public.validate_quote_items(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Adicione pelo menos um serviço.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS i(service_id uuid, quantity int, unit_price numeric)
    WHERE i.quantity IS NULL OR i.quantity < 1
       OR i.unit_price IS NULL OR i.unit_price < 0
  ) THEN
    RAISE EXCEPTION 'Quantidade ou preço inválido.';
  END IF;

  -- RLS em services: só enxerga serviços da própria loja
  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_items) AS i(service_id uuid)
    WHERE NOT EXISTS (SELECT 1 FROM public.services s WHERE s.id = i.service_id)
  ) THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;
END;
$$;


-- =============================================
-- create_quote: cliente/veículo novos (opcionais) + orçamento + itens
-- p_new_client:  {name, phone}
-- p_new_vehicle: {plate, brand, brand_code, model, model_code, year}
-- =============================================

CREATE OR REPLACE FUNCTION public.create_quote(
  p_client_id     uuid  DEFAULT NULL,
  p_vehicle_id    uuid  DEFAULT NULL,
  p_new_client    jsonb DEFAULT NULL,
  p_new_vehicle   jsonb DEFAULT NULL,
  p_items         jsonb DEFAULT '[]'::jsonb,
  p_vehicle_notes text  DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tenant_id  uuid := public.get_my_tenant_id();
  v_client_id  uuid := p_client_id;
  v_vehicle_id uuid := p_vehicle_id;
  v_quote_id   uuid;
  v_total      numeric(10,2);
BEGIN
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  PERFORM public.validate_quote_items(p_items);

  -- Cliente: existente (visível via RLS) ou novo
  IF v_client_id IS NULL THEN
    IF p_new_client IS NULL OR coalesce(trim(p_new_client->>'name'), '') = '' THEN
      RAISE EXCEPTION 'Cliente obrigatório';
    END IF;
    INSERT INTO public.clients (tenant_id, name, phone)
    VALUES (
      v_tenant_id,
      trim(p_new_client->>'name'),
      coalesce(trim(p_new_client->>'phone'), '')
    )
    RETURNING id INTO v_client_id;
  ELSIF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = v_client_id) THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;

  -- Veículo: existente (do mesmo cliente), novo, ou nenhum
  IF v_vehicle_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.vehicles WHERE id = v_vehicle_id AND client_id = v_client_id
    ) THEN
      RAISE EXCEPTION 'Veículo não encontrado';
    END IF;
  ELSIF p_new_vehicle IS NOT NULL AND coalesce(trim(p_new_vehicle->>'plate'), '') <> '' THEN
    INSERT INTO public.vehicles (tenant_id, client_id, plate, brand, brand_code, model, model_code, year)
    VALUES (
      v_tenant_id,
      v_client_id,
      upper(trim(p_new_vehicle->>'plate')),
      nullif(trim(p_new_vehicle->>'brand'), ''),
      nullif(trim(p_new_vehicle->>'brand_code'), ''),
      nullif(trim(p_new_vehicle->>'model'), ''),
      nullif(trim(p_new_vehicle->>'model_code'), ''),
      nullif(trim(p_new_vehicle->>'year'), '')
    )
    RETURNING id INTO v_vehicle_id;
  END IF;

  SELECT coalesce(sum(i.quantity * i.unit_price), 0)
  INTO v_total
  FROM jsonb_to_recordset(p_items) AS i(service_id uuid, quantity int, unit_price numeric);

  INSERT INTO public.quotes (tenant_id, client_id, vehicle_id, status, total_value, vehicle_notes)
  VALUES (v_tenant_id, v_client_id, v_vehicle_id, 'Aguardando Aprovacao', v_total, nullif(p_vehicle_notes, ''))
  RETURNING id INTO v_quote_id;

  INSERT INTO public.quote_items (quote_id, service_id, quantity, unit_price)
  SELECT v_quote_id, i.service_id, i.quantity, i.unit_price
  FROM jsonb_to_recordset(p_items) AS i(service_id uuid, quantity int, unit_price numeric);

  RETURN v_quote_id;
END;
$$;


-- =============================================
-- update_quote: substitui itens + total + observações
-- p_total pode diferir da soma dos itens (desconto manual)
-- =============================================

CREATE OR REPLACE FUNCTION public.update_quote(
  p_quote_id      uuid,
  p_items         jsonb,
  p_total         numeric,
  p_vehicle_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM public.validate_quote_items(p_items);

  IF p_total IS NULL OR p_total < 0 THEN
    RAISE EXCEPTION 'Valor total inválido.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.quotes WHERE id = p_quote_id) THEN
    RAISE EXCEPTION 'Orçamento não encontrado';
  END IF;

  DELETE FROM public.quote_items WHERE quote_id = p_quote_id;

  INSERT INTO public.quote_items (quote_id, service_id, quantity, unit_price)
  SELECT p_quote_id, i.service_id, i.quantity, i.unit_price
  FROM jsonb_to_recordset(p_items) AS i(service_id uuid, quantity int, unit_price numeric);

  UPDATE public.quotes
  SET total_value = p_total,
      vehicle_notes = nullif(p_vehicle_notes, '')
  WHERE id = p_quote_id;
END;
$$;


REVOKE EXECUTE ON FUNCTION public.validate_quote_items(jsonb) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.create_quote(uuid, uuid, jsonb, jsonb, jsonb, text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.update_quote(uuid, jsonb, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.validate_quote_items(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_quote(uuid, uuid, jsonb, jsonb, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_quote(uuid, jsonb, numeric, text) TO authenticated;


-- =============================================
-- 8. DATA DE ENTREGA + ÍNDICES DO DASHBOARD MENSAL
-- =============================================

-- Preenche delivered_at quando o status vira 'Entregue' e limpa quando sai.
-- Trigger no banco: vale para Kanban, edição ou qualquer outro caminho.
CREATE OR REPLACE FUNCTION public.set_quote_delivered_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Entregue' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Entregue' OR NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    END IF;
  ELSE
    NEW.delivered_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quotes_set_delivered_at ON public.quotes;
CREATE TRIGGER quotes_set_delivered_at
  BEFORE INSERT OR UPDATE OF status ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_quote_delivered_at();

CREATE INDEX IF NOT EXISTS quotes_tenant_delivered_at_idx
  ON public.quotes (tenant_id, delivered_at);
CREATE INDEX IF NOT EXISTS quotes_tenant_created_at_idx
  ON public.quotes (tenant_id, created_at);


-- =============================================
-- 9. CUSTOS DA ESTÉTICA (tela Custos + lucro no dashboard)
-- =============================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  description   text          NOT NULL CHECK (length(trim(description)) > 0),
  amount        decimal(10,2) NOT NULL CHECK (amount > 0),
  -- Só a data (sem hora): o custo nunca muda de mês por causa de fuso
  expense_date  date          NOT NULL DEFAULT current_date,
  -- Texto livre: a tela sugere uma lista padrão, mas aceita qualquer categoria
  category      text          NOT NULL DEFAULT 'Outros' CHECK (length(trim(category)) > 0),
  -- Fixo = entra no "copiar custos fixos do mês anterior"
  is_fixed      boolean       NOT NULL DEFAULT false,
  created_at    timestamptz   DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_all" ON public.expenses;
CREATE POLICY "expenses_all" ON public.expenses
  FOR ALL
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
REVOKE ALL ON public.expenses FROM anon;

CREATE INDEX IF NOT EXISTS expenses_tenant_date_idx
  ON public.expenses (tenant_id, expense_date);
