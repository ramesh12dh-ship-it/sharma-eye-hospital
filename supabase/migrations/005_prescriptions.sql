-- =============================================================
-- MIGRATION 005: Prescriptions table + Storage policies
-- Run in Supabase SQL Editor.
-- NOTE: Create the 'prescriptions' storage bucket in Supabase
--       Dashboard → Storage → New bucket → name: prescriptions → Private
--       BEFORE running the storage policy section below.
-- =============================================================

-- 1. Prescriptions table (all clinical fields are nullable — nothing is mandatory)
CREATE TABLE public.prescriptions (
    prescription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES public.patients(patient_id) ON DELETE CASCADE,
    recorded_by     UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,

    -- Right eye (all nullable)
    r_sph  NUMERIC(5,2),
    r_cyl  NUMERIC(5,2),
    r_axis INTEGER CHECK (r_axis >= 0 AND r_axis <= 180),
    r_add  NUMERIC(5,2),

    -- Left eye (all nullable)
    l_sph  NUMERIC(5,2),
    l_cyl  NUMERIC(5,2),
    l_axis INTEGER CHECK (l_axis >= 0 AND l_axis <= 180),
    l_add  NUMERIC(5,2),

    -- Pupillary distance
    pd NUMERIC(5,1),

    -- Path in Supabase Storage bucket 'prescriptions' (optional)
    document_path TEXT,

    -- Optional free-text notes
    notes TEXT
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX prescriptions_patient_id_idx ON public.prescriptions(patient_id);

-- 2. RLS: all clinical staff can view prescriptions
CREATE POLICY "Staff can view prescriptions" ON public.prescriptions
    FOR SELECT TO authenticated
    USING (
        public.has_role('receptionist') OR
        public.has_role('optician') OR
        public.has_role('store_manager') OR
        public.has_role('accountant')
    );

-- 3. RLS: optician + admin can create/edit/delete
CREATE POLICY "Opticians can manage prescriptions" ON public.prescriptions
    FOR ALL TO authenticated
    USING (public.has_role('optician'))
    WITH CHECK (public.has_role('optician'));

-- 4. Storage policies for 'prescriptions' bucket
--    (Only run after creating the bucket in Supabase Dashboard)

-- All clinical staff can view prescription documents
CREATE POLICY "Staff can view prescription docs"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'prescriptions' AND (
            public.has_role('receptionist') OR
            public.has_role('optician') OR
            public.has_role('store_manager')
        )
    );

-- Optician/admin can upload
CREATE POLICY "Opticians can upload prescription docs"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'prescriptions' AND public.has_role('optician')
    );

-- Optician/admin can delete
CREATE POLICY "Opticians can delete prescription docs"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'prescriptions' AND public.has_role('optician')
    );
