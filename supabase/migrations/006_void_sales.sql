-- =============================================================
-- MIGRATION 006: Add voiding capability to sales
-- Run in Supabase SQL Editor.
-- =============================================================

-- 1. Add is_voided and voided_at columns to sales
ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES auth.users(id);

-- 2. Create a function to void a sale and replenish stock
CREATE OR REPLACE FUNCTION public.void_sale(target_sale_id UUID, admin_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_product_code TEXT;
    v_is_already_voided BOOLEAN;
BEGIN
    -- Check if sale is already voided
    SELECT product_code, is_voided INTO v_product_code, v_is_already_voided
    FROM public.sales
    WHERE sale_id = target_sale_id;

    IF v_is_already_voided THEN
        RAISE EXCEPTION 'Sale is already voided';
    END IF;

    -- Update the sale record
    UPDATE public.sales
    SET 
        is_voided = TRUE,
        voided_at = now(),
        voided_by = admin_user_id
    WHERE sale_id = target_sale_id;

    -- Replenish the stock in products table
    UPDATE public.products
    SET stock = stock + 1
    WHERE product_code = v_product_code;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
