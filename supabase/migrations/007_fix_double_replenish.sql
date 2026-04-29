-- =============================================================
-- MIGRATION 007: Fix stock replenishment on delete for voided sales
-- Run in Supabase SQL Editor.
-- =============================================================

CREATE OR REPLACE FUNCTION public.restore_inventory_on_sale_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only replenish stock if the sale was NOT already voided.
    -- If it was voided, the void_sale function already replenished the stock.
    IF OLD.is_voided = FALSE THEN
        UPDATE public.products
        SET stock = stock + 1
        WHERE product_code = OLD.product_code;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
