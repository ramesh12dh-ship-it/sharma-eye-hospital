-- =============================================================
-- MIGRATION 010: Snapshot prescription onto optical orders
--
-- Why: workshop staff (and the order card) need to see the Rx
-- without bouncing to the patient file. We snapshot at insert
-- time so updating the patient's Rx later does NOT silently
-- mutate orders that are already in flight.
--
-- Run in Supabase SQL Editor.
-- =============================================================

-- 1. Add Rx snapshot columns to optical_orders
ALTER TABLE public.optical_orders
    ADD COLUMN IF NOT EXISTS prescription_id UUID
        REFERENCES public.prescriptions(prescription_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS r_sph  NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS r_cyl  NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS r_axis INTEGER CHECK (r_axis >= 0 AND r_axis <= 180),
    ADD COLUMN IF NOT EXISTS r_add  NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS l_sph  NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS l_cyl  NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS l_axis INTEGER CHECK (l_axis >= 0 AND l_axis <= 180),
    ADD COLUMN IF NOT EXISTS l_add  NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS pd     NUMERIC(5,1),
    ADD COLUMN IF NOT EXISTS rx_notes TEXT;

-- 2. Trigger function — copies the patient's latest Rx onto the order
--    Runs BEFORE INSERT so the snapshot is captured atomically.
--    SECURITY DEFINER bypasses RLS so receptionists (who can't read
--    prescriptions directly) can still create orders that pull the Rx.
CREATE OR REPLACE FUNCTION public.snapshot_prescription_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    rx RECORD;
BEGIN
    -- Skip if caller already supplied an Rx (allows manual override).
    IF NEW.prescription_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    SELECT *
        INTO rx
        FROM public.prescriptions
        WHERE patient_id = NEW.patient_id
        ORDER BY created_at DESC
        LIMIT 1;

    IF FOUND THEN
        NEW.prescription_id := rx.prescription_id;
        NEW.r_sph  := rx.r_sph;
        NEW.r_cyl  := rx.r_cyl;
        NEW.r_axis := rx.r_axis;
        NEW.r_add  := rx.r_add;
        NEW.l_sph  := rx.l_sph;
        NEW.l_cyl  := rx.l_cyl;
        NEW.l_axis := rx.l_axis;
        NEW.l_add  := rx.l_add;
        NEW.pd     := rx.pd;
        NEW.rx_notes := rx.notes;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_optical_order_rx_snapshot ON public.optical_orders;
CREATE TRIGGER on_optical_order_rx_snapshot
    BEFORE INSERT ON public.optical_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.snapshot_prescription_on_order();

-- 3. Optional: backfill existing orders from each patient's latest Rx.
--    Safe — only fills orders that don't already have a snapshot.
UPDATE public.optical_orders o
   SET prescription_id = rx.prescription_id,
       r_sph = rx.r_sph, r_cyl = rx.r_cyl, r_axis = rx.r_axis, r_add = rx.r_add,
       l_sph = rx.l_sph, l_cyl = rx.l_cyl, l_axis = rx.l_axis, l_add = rx.l_add,
       pd = rx.pd,
       rx_notes = rx.notes
  FROM (
      SELECT DISTINCT ON (patient_id) *
        FROM public.prescriptions
        ORDER BY patient_id, created_at DESC
  ) rx
 WHERE o.patient_id = rx.patient_id
   AND o.prescription_id IS NULL;
