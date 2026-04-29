-- =============================================================
-- MIGRATION 010: Order RLS & Performance Polish
-- Run in Supabase SQL Editor.
-- =============================================================

-- 1. Update Optical Orders RLS to use the new multi-role helper
DROP POLICY IF EXISTS "Admins and managers can do anything with orders" ON public.optical_orders;
DROP POLICY IF EXISTS "Receptionists and Opticians can view orders" ON public.optical_orders;

CREATE POLICY "Authorized staff can manage orders" ON public.optical_orders
    FOR ALL TO authenticated
    USING (
        public.has_role('admin') OR 
        public.has_role('store_manager') OR 
        public.has_role('optician') OR
        public.has_role('receptionist')
    );

-- 2. Performance: Indexes for common reporting and order lookups
CREATE INDEX IF NOT EXISTS sales_transaction_id_idx ON public.sales(transaction_id);
CREATE INDEX IF NOT EXISTS sales_sale_date_idx ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS prescriptions_patient_id_idx ON public.prescriptions(patient_id);
