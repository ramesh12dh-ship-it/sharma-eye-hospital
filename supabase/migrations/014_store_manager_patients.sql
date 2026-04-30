-- =============================================================
-- MIGRATION 014: Allow store managers to create/edit patients
--
-- Run in Supabase SQL Editor.
-- =============================================================

-- Replace the receptionist-only management policy with a broader one that
-- also covers store managers (admin already passes via has_role).
DROP POLICY IF EXISTS "Admins and receptionists can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Authorized staff can manage patients" ON public.patients;

CREATE POLICY "Authorized staff can manage patients" ON public.patients
    FOR ALL TO authenticated
    USING (
        public.has_role('receptionist') OR
        public.has_role('store_manager')
    )
    WITH CHECK (
        public.has_role('receptionist') OR
        public.has_role('store_manager')
    );
