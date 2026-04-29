-- =============================================================
-- MIGRATION 003: Multi-role support per user
-- Admin has all access. Other roles can be combined freely.
-- Run in Supabase SQL Editor.
-- =============================================================

-- 1. Remove the UNIQUE constraint that enforces one role per user
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

-- 2. Add a composite unique to prevent duplicate role assignments for same user
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- 3. Create get_user_roles() returning an array of all roles for the current user
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS public.user_role[]
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT ARRAY_AGG(role) FROM public.user_roles WHERE user_id = auth.uid();
$$;

-- 4. Create has_role() helper: returns true if user has the role OR is admin
--    This is the single source of truth for all permission checks.
CREATE OR REPLACE FUNCTION public.has_role(check_role public.user_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND (role = check_role OR role = 'admin')
  );
$$;

-- 5. Rebuild get_user_role() to return the highest role for backward compatibility
--    (admin > store_manager > receptionist > optician > accountant)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY
    CASE role
      WHEN 'admin'         THEN 1
      WHEN 'store_manager' THEN 2
      WHEN 'receptionist'  THEN 3
      WHEN 'optician'      THEN 4
      WHEN 'accountant'    THEN 5
    END
  LIMIT 1;
$$;

-- 6. Rebuild all RLS policies to use has_role() instead of get_user_role()
-- This ensures admin always passes every check.

-- user_roles (read own)
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- products (view)
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT TO authenticated
    USING (true);

-- products (modify)
DROP POLICY IF EXISTS "Only admins can modify products" ON public.products;
CREATE POLICY "Only admins can modify products" ON public.products
    FOR ALL TO authenticated
    USING (has_role('admin'));

-- sales (view: admin, accountant, store_manager, receptionist)
DROP POLICY IF EXISTS "Admins and accountants can view sales" ON public.sales;
DROP POLICY IF EXISTS "Store managers can view own sales" ON public.sales;
DROP POLICY IF EXISTS "Receptionists can view sales" ON public.sales;

CREATE POLICY "Staff can view sales" ON public.sales
    FOR SELECT TO authenticated
    USING (
        has_role('accountant') OR
        has_role('store_manager') OR
        has_role('receptionist')
    );

-- sales (insert: store_manager, receptionist)
DROP POLICY IF EXISTS "Authorized staff can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Store managers and admins can insert sales" ON public.sales;
CREATE POLICY "Authorized staff can insert sales" ON public.sales
    FOR INSERT TO authenticated
    WITH CHECK (has_role('store_manager') OR has_role('receptionist'));

-- sales (delete: admin only)
DROP POLICY IF EXISTS "Only admins can delete sales" ON public.sales;
CREATE POLICY "Only admins can delete sales" ON public.sales
    FOR DELETE TO authenticated
    USING (has_role('admin'));

-- patients (manage: admin + receptionist)
DROP POLICY IF EXISTS "Admins and receptionists can manage patients" ON public.patients;
CREATE POLICY "Admins and receptionists can manage patients" ON public.patients
    FOR ALL TO authenticated
    USING (has_role('receptionist'));

-- patients (view: all staff)
DROP POLICY IF EXISTS "All staff can view patients" ON public.patients;
CREATE POLICY "All staff can view patients" ON public.patients
    FOR SELECT TO authenticated
    USING (
        has_role('receptionist') OR
        has_role('store_manager') OR
        has_role('optician') OR
        has_role('accountant')
    );
