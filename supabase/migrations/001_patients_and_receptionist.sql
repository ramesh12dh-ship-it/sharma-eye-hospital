-- =============================================================
-- MILESTONE A MIGRATION — Run in TWO separate queries in Supabase SQL Editor
-- PostgreSQL requires enum values to be committed before they can be used.
-- =============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: Run this block FIRST. Click "Run". Wait for success.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'receptionist';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'optician';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: Run this block SECOND (new query). Only after Step 1 succeeds.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Patients table
CREATE TABLE IF NOT EXISTS public.patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(phone)
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Add patient_id and order_status to sales table
ALTER TABLE public.sales 
    ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(patient_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'Instant Delivery'
        CHECK (order_status IN ('Instant Delivery', 'Sent to Lab', 'Ready for Pickup', 'Delivered'));

-- RLS: Admins and receptionists can fully manage patients
CREATE POLICY "Admins and receptionists can manage patients" ON public.patients
    FOR ALL TO authenticated
    USING (public.get_user_role() IN ('admin', 'receptionist'));

-- RLS: All clinical staff can read patients
CREATE POLICY "All staff can view patients" ON public.patients
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'receptionist', 'store_manager', 'optician', 'accountant'));

-- Update sales insert policy to include receptionist
DROP POLICY IF EXISTS "Store managers and admins can insert sales" ON public.sales;
CREATE POLICY "Authorized staff can insert sales" ON public.sales
    FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('store_manager', 'admin', 'receptionist'));

-- Allow receptionist to view sales
CREATE POLICY "Receptionists can view sales" ON public.sales
    FOR SELECT TO authenticated
    USING (public.get_user_role() = 'receptionist');

-- DONE! Run 002_update_role_trigger.sql next to add email mappings.

-- =============================================================
