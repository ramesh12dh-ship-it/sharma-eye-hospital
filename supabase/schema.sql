CREATE TYPE public.user_role AS ENUM ('admin', 'store_manager', 'accountant');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.user_role NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.products (
    product_code TEXT PRIMARY KEY,
    lens_width TEXT,
    brands TEXT,
    location TEXT,
    type TEXT,
    comments TEXT,
    mrp NUMERIC,
    cost_price NUMERIC,
    sale_price_s NUMERIC,
    sale_price_a NUMERIC,
    stock INTEGER DEFAULT 0,
    date_added DATE DEFAULT CURRENT_DATE
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sales (
    sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT REFERENCES public.products(product_code) NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI')) NOT NULL,
    sale_amount NUMERIC NOT NULL,
    tax_rate NUMERIC CHECK (tax_rate IN (5, 12)) NOT NULL,
    recorded_by UUID REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

CREATE POLICY "Users can read own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Only admins can modify products" ON public.products
    FOR ALL TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins and accountants can view sales" ON public.sales
    FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('admin', 'accountant'));

CREATE POLICY "Store managers can view own sales" ON public.sales
    FOR SELECT TO authenticated
    USING (public.get_user_role() = 'store_manager' AND recorded_by = auth.uid());

CREATE POLICY "Store managers and admins can insert sales" ON public.sales
    FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('store_manager', 'admin'));

CREATE POLICY "Only admins can delete sales" ON public.sales
    FOR DELETE TO authenticated
    USING (public.get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.deduct_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - 1
    WHERE product_code = NEW.product_code;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_sale_insert
    AFTER INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.deduct_inventory_on_sale();

CREATE OR REPLACE FUNCTION public.restore_inventory_on_sale_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock = stock + 1
    WHERE product_code = OLD.product_code;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_sale_delete
    AFTER DELETE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.restore_inventory_on_sale_delete();

CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE 
  assigned_role public.user_role;
BEGIN
    IF LOWER(TRIM(NEW.email)) IN ('admin1@example.com', 'admin2@example.com') THEN 
        assigned_role := 'admin'::public.user_role;
    ELSIF LOWER(TRIM(NEW.email)) IN ('manager1@example.com', 'manager2@example.com') THEN 
        assigned_role := 'store_manager'::public.user_role;
    ELSIF LOWER(TRIM(NEW.email)) = 'accountant@example.com' THEN 
        assigned_role := 'accountant'::public.user_role;
    ELSE 
        RAISE EXCEPTION 'Email not authorized';
    END IF;

    INSERT INTO public.user_roles (user_id, role, email) 
    VALUES (NEW.id, assigned_role, LOWER(TRIM(NEW.email)));
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW 
    EXECUTE FUNCTION public.assign_user_role();