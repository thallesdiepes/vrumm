-- Migration: criação/edição de orçamento atômicas
-- Execute INTEIRO no SQL Editor do Supabase ANTES do deploy do código
-- (o código novo chama estas funções; o código antigo não depende delas).
--
-- Antes, createQuote/updateQuote faziam várias chamadas separadas
-- (apaga itens → insere itens → atualiza total). Se uma falhasse no meio,
-- o orçamento ficava sem itens. Uma função Postgres roda inteira numa
-- transação: ou aplica tudo, ou nada.
--
-- SECURITY INVOKER: roda com as permissões do usuário logado, então o RLS
-- continua garantindo que ele só mexe nos dados da própria loja.

BEGIN;

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

COMMIT;
