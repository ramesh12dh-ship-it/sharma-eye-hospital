-- =============================================================
-- MIGRATION 009: Admin Role Management
-- Run in Supabase SQL Editor.
-- =============================================================

-- Allow admins to manage all roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role('admin'));

-- Update the auto-assign function to be less restrictive if needed,
-- or just keep it as a fallback. 
-- For now, the Admin will use the UI to bypass the "Email not authorized" logic
-- if they want to invite someone manually.
