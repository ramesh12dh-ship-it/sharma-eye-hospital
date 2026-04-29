-- =============================================================
-- MIGRATION 008: Optical Order Workflow Tracker
-- Run in Supabase SQL Editor.
-- =============================================================

-- 1. Define order status enum
CREATE TYPE public.order_status AS ENUM ('ordered', 'in_workshop', 'ready', 'delivered', 'cancelled');

-- 2. Create the optical_orders table
CREATE TABLE IF NOT EXISTS public.optical_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL, -- Links to one or more rows in sales
    patient_id UUID REFERENCES public.patients(patient_id) NOT NULL,
    status public.order_status DEFAULT 'ordered' NOT NULL,
    notes TEXT, -- Lab/Workshop instructions
    expected_date DATE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.optical_orders ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
CREATE POLICY "Admins and managers can do anything with orders" ON public.optical_orders
    FOR ALL TO authenticated
    USING (public.get_user_role() IN ('admin', 'store_manager'));

CREATE POLICY "Receptionists and Opticians can view orders" ON public.optical_orders
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('receptionist', 'optician'));

-- 5. Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_optical_orders_updated_at
    BEFORE UPDATE ON public.optical_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index for fast lookup by transaction or patient
CREATE INDEX IF NOT EXISTS optical_orders_transaction_id_idx ON public.optical_orders(transaction_id);
CREATE INDEX IF NOT EXISTS optical_orders_patient_id_idx ON public.optical_orders(patient_id);
CREATE INDEX IF NOT EXISTS optical_orders_status_idx ON public.optical_orders(status);
