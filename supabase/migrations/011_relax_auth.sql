-- =============================================================
-- MIGRATION 011: Relaxed Auth Trigger
-- Prevents the 'Email not authorized' crash during user creation.
-- Allows Admins to create users from the console or the app UI.
-- =============================================================

CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE 
  assigned_role public.user_role;
BEGIN
    -- Check for pre-approved roles
    IF LOWER(TRIM(NEW.email)) IN ('admin1@example.com', 'admin2@example.com') THEN 
        assigned_role := 'admin'::public.user_role;
    ELSIF LOWER(TRIM(NEW.email)) IN ('manager1@example.com', 'manager2@example.com') THEN 
        assigned_role := 'store_manager'::public.user_role;
    ELSIF LOWER(TRIM(NEW.email)) = 'accountant@example.com' THEN 
        assigned_role := 'accountant'::public.user_role;
    ELSIF LOWER(TRIM(NEW.email)) IN ('receptionist1@example.com', 'receptionist2@example.com') THEN 
        assigned_role := 'receptionist'::public.user_role;
    ELSIF LOWER(TRIM(NEW.email)) IN ('optician1@example.com', 'optician2@example.com') THEN 
        assigned_role := 'optician'::public.user_role;
    END IF;

    -- If a role is found, auto-assign it. 
    -- If not, just RETURN NEW so the user is still created in auth.users.
    -- The Admin can then assign a role manually in the User Management dashboard.
    IF assigned_role IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role, email) 
        VALUES (NEW.id, assigned_role, LOWER(TRIM(NEW.email)));
    END IF;
    
    RETURN NEW;
END;
$$;
