-- Harden Data API grants for the internal hospital app.
--
-- The live project has RLS enabled on the app tables, but the default Supabase
-- grants still expose broad table/function privileges to anon. RLS blocks rows,
-- but anonymous clients should not have any direct capability against internal
-- inventory, patient, prescription, sales, order, or role objects.

REVOKE ALL ON TABLE
  public.optical_orders,
  public.patients,
  public.prescriptions,
  public.products,
  public.sales,
  public.user_roles
FROM anon;

REVOKE EXECUTE ON FUNCTION public.assign_user_role()
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.deduct_inventory_on_sale()
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.restore_inventory_on_sale_delete()
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.snapshot_prescription_on_order()
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_role()
FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_user_roles()
FROM anon;

REVOKE EXECUTE ON FUNCTION public.has_role(public.user_role)
FROM anon;

REVOKE EXECUTE ON FUNCTION public.void_sale(uuid, uuid)
FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;
