-- =============================================================
-- MIGRATION 013: Security & access-control fixes
--
-- Run in TWO steps. PostgreSQL requires ALTER TYPE to commit
-- before the new enum value can be used elsewhere — so step 1
-- must be a separate query.
-- =============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: Add the new 'doctor' enum value. Run alone first.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'doctor';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: Tighten RLS, harden the void_sale RPC, and add a
-- non-negative stock guard. Run after Step 1 has committed.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Sales: stop callers from spoofing recorded_by
-- has_role() returns true for admins via pass-through.
DROP POLICY IF EXISTS "Authorized staff can insert sales" ON public.sales;
CREATE POLICY "Authorized staff can insert sales" ON public.sales
    FOR INSERT TO authenticated
    WITH CHECK (
        (public.has_role('store_manager') OR public.has_role('receptionist'))
        AND recorded_by = auth.uid()
    );

-- Products: prevent negative stock from concurrent or stale sales.
-- If this fails on existing data, fix the offending rows first.
ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS products_stock_nonnegative;
ALTER TABLE public.products
    ADD CONSTRAINT products_stock_nonnegative CHECK (stock >= 0);

-- void_sale: SECURITY DEFINER bypasses RLS, so authorize inside.
-- Store managers (admins via pass-through) can void.
CREATE OR REPLACE FUNCTION public.void_sale(target_sale_id UUID, admin_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_product_code TEXT;
    v_is_already_voided BOOLEAN;
BEGIN
    IF NOT public.has_role('store_manager') THEN
        RAISE EXCEPTION 'Not authorized to void sales';
    END IF;

    SELECT product_code, is_voided INTO v_product_code, v_is_already_voided
    FROM public.sales
    WHERE sale_id = target_sale_id;

    IF v_is_already_voided THEN
        RAISE EXCEPTION 'Sale is already voided';
    END IF;

    UPDATE public.sales
    SET is_voided = TRUE,
        voided_at = now(),
        voided_by = admin_user_id
    WHERE sale_id = target_sale_id;

    UPDATE public.products
    SET stock = stock + 1
    WHERE product_code = v_product_code;
END;
$$;

-- Optical orders: split the omnibus FOR ALL policy so that only
-- the staff who should be able to write can write.
--   SELECT — every clinical role
--   INSERT — POS staff (store_manager, receptionist) create orders at checkout
--   UPDATE — store_manager only (status transitions)
--   DELETE — admin only
DROP POLICY IF EXISTS "Authorized staff can manage orders"          ON public.optical_orders;
DROP POLICY IF EXISTS "Admins and managers can do anything with orders" ON public.optical_orders;
DROP POLICY IF EXISTS "Receptionists and Opticians can view orders" ON public.optical_orders;

CREATE POLICY "Staff can view orders" ON public.optical_orders
    FOR SELECT TO authenticated
    USING (
        public.has_role('store_manager') OR
        public.has_role('receptionist')  OR
        public.has_role('optician')      OR
        public.has_role('accountant')
    );

CREATE POLICY "POS staff can create orders" ON public.optical_orders
    FOR INSERT TO authenticated
    WITH CHECK (
        public.has_role('store_manager') OR public.has_role('receptionist')
    );

CREATE POLICY "Store managers can update orders" ON public.optical_orders
    FOR UPDATE TO authenticated
    USING      (public.has_role('store_manager'))
    WITH CHECK (public.has_role('store_manager'));

CREATE POLICY "Admins can delete orders" ON public.optical_orders
    FOR DELETE TO authenticated
    USING (public.has_role('admin'));
