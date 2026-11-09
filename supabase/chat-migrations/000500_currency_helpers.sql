-- =============================================================================
-- Migración Chat 0005: Totales separados CUP / USD en pedidos directos y avisos
-- Se aplica en AMBOS proyectos Supabase. Nunca convierte entre monedas.
-- =============================================================================

ALTER TABLE public.direct_orders
  ADD COLUMN IF NOT EXISTS totals_by_currency jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.is_valid_currency_totals(p_totals jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_totals IS NOT NULL
    AND jsonb_typeof(p_totals) = 'object'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each(p_totals) AS e(key, value)
      WHERE e.key NOT IN ('CUP', 'USD')
        OR jsonb_typeof(e.value) <> 'number'
        OR (e.value::text)::numeric < 0
    );
$$;

ALTER TABLE public.direct_orders
  DROP CONSTRAINT IF EXISTS chk_direct_orders_totals_currency;
ALTER TABLE public.direct_orders
  ADD CONSTRAINT chk_direct_orders_totals_currency
  CHECK (public.is_valid_currency_totals(totals_by_currency));

UPDATE public.direct_orders
SET totals_by_currency = jsonb_build_object('CUP', estimated_total_cup)
WHERE totals_by_currency = '{}'::jsonb OR totals_by_currency IS NULL;

COMMENT ON COLUMN public.direct_orders.estimated_total_cup IS
  'Subtotal exclusivo en CUP; el desglose completo está en totals_by_currency.';

CREATE OR REPLACE FUNCTION public.build_currency_totals(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_qty numeric;
  v_price numeric;
  v_currency text;
  v_total_cup numeric := 0;
  v_total_usd numeric := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Los artículos del pedido deben ser una lista.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE(NULLIF(v_item->>'quantity', '')::numeric, 0);
    v_price := COALESCE(
      NULLIF(v_item->>'unit_price', ''),
      NULLIF(v_item->>'unit_price_cup', ''),
      '0'
    )::numeric;
    v_currency := upper(COALESCE(NULLIF(v_item->>'currency_code', ''), 'CUP'));

    IF v_qty <= 0 OR v_qty > 999 OR v_price < 0 THEN
      RAISE EXCEPTION 'Datos de línea de pedido inválidos.';
    END IF;
    IF v_currency NOT IN ('CUP', 'USD') THEN
      RAISE EXCEPTION 'Moneda de pedido no permitida.';
    END IF;

    IF v_currency = 'CUP' THEN
      v_total_cup := v_total_cup + round(v_price * v_qty, 2);
    ELSE
      v_total_usd := v_total_usd + round(v_price * v_qty, 2);
    END IF;
  END LOOP;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'CUP', CASE WHEN v_total_cup > 0 THEN round(v_total_cup, 2) ELSE NULL END,
    'USD', CASE WHEN v_total_usd > 0 THEN round(v_total_usd, 2) ELSE NULL END
  ));
END;
$$;

CREATE OR REPLACE FUNCTION public.format_currency_totals(p_totals jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    string_agg(
      format(
        '%s %s',
        replace(to_char((e.value::text)::numeric, 'FM9999999990.00'), '.', ','),
        e.key
      ),
      ' + ' ORDER BY CASE e.key WHEN 'CUP' THEN 1 WHEN 'USD' THEN 2 ELSE 3 END
    ),
    '0,00 CUP'
  )
  FROM jsonb_each(COALESCE(p_totals, '{}'::jsonb)) AS e(key, value)
  WHERE e.key IN ('CUP', 'USD')
    AND jsonb_typeof(e.value) = 'number'
    AND (e.value::text)::numeric > 0;
$$;
