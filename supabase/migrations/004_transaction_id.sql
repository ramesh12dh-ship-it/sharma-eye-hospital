-- =============================================================
-- MIGRATION 004: Add transaction_id to sales for invoice grouping
-- Run in Supabase SQL Editor.
-- =============================================================

-- Add transaction_id column to group all items from one checkout together
ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS transaction_id UUID DEFAULT gen_random_uuid();

-- Index for fast lookup by transaction
CREATE INDEX IF NOT EXISTS sales_transaction_id_idx ON public.sales(transaction_id);
