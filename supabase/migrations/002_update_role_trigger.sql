-- =============================================================
-- MIGRATION 002: Update role assignment trigger
-- Run this in Supabase SQL Editor AFTER running 001.
--
-- Replace the placeholder emails below with your real staff emails
-- before running!
-- =============================================================

CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE 
  assigned_role public.user_role;
BEGIN
    -- ✏️ Replace with real admin email(s)
    IF LOWER(TRIM(NEW.email)) IN ('admin1@example.com', 'admin2@example.com') THEN 
        assigned_role := 'admin'::public.user_role;

    -- ✏️ Replace with real store manager email(s)
    ELSIF LOWER(TRIM(NEW.email)) IN ('manager1@example.com', 'manager2@example.com') THEN 
        assigned_role := 'store_manager'::public.user_role;

    -- ✏️ Replace with real accountant email(s)
    ELSIF LOWER(TRIM(NEW.email)) = 'accountant@example.com' THEN 
        assigned_role := 'accountant'::public.user_role;

    -- ✏️ Replace with real receptionist email(s)
    ELSIF LOWER(TRIM(NEW.email)) IN ('receptionist1@example.com', 'receptionist2@example.com') THEN 
        assigned_role := 'receptionist'::public.user_role;

    -- ✏️ Replace with real optician email(s)
    ELSIF LOWER(TRIM(NEW.email)) IN ('optician1@example.com', 'optician2@example.com') THEN 
        assigned_role := 'optician'::public.user_role;

    ELSE 
        RAISE EXCEPTION 'Email % is not authorized to access this system.', NEW.email;
    END IF;

    INSERT INTO public.user_roles (user_id, role, email) 
    VALUES (NEW.id, assigned_role, LOWER(TRIM(NEW.email)));
    
    RETURN NEW;
END;
$$;
