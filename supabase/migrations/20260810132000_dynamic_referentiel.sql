-- Create departements table
CREATE TABLE IF NOT EXISTS public.departements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    libelle TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create filieres table
CREATE TABLE IF NOT EXISTS public.filieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    libelle TEXT NOT NULL,
    departement_id UUID NOT NULL REFERENCES public.departements(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- In this existing project, classes already exists? Let's check. 
-- Wait, we need to alter classes to add filiere_id and niveau if they don't exist.
-- To make this safe, we use DO blocks or just ALTER TABLE if we are sure.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classes') THEN
        CREATE TABLE public.classes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code TEXT NOT NULL UNIQUE,
            libelle TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
END $$;

ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS filiere_id UUID REFERENCES public.filieres(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS niveau TEXT;

-- Update ues to link to classes
ALTER TABLE public.ues
ADD COLUMN IF NOT EXISTS classe_id UUID REFERENCES public.classes(id) ON DELETE CASCADE;

-- Insert default data
INSERT INTO public.departements (code, libelle) VALUES
('MTIC', 'Management des TIC'),
('RSN', 'Réseaux et Systèmes Numériques'),
('AV', 'Audio-Visuel')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.filieres (code, libelle, departement_id)
SELECT 'TC', 'Technique Commercial', id FROM public.departements WHERE code = 'MTIC' UNION ALL
SELECT 'MD', 'Marketing Digital', id FROM public.departements WHERE code = 'MTIC' UNION ALL
SELECT 'GI', 'Génie Informatique', id FROM public.departements WHERE code = 'RSN' UNION ALL
SELECT 'RT', 'Réseaux et Télécommunication', id FROM public.departements WHERE code = 'RSN' UNION ALL
SELECT 'JO', 'Journalisme', id FROM public.departements WHERE code = 'AV' UNION ALL
SELECT 'VD', 'Vidéo', id FROM public.departements WHERE code = 'AV' UNION ALL
SELECT 'AU', 'Audio', id FROM public.departements WHERE code = 'AV'
ON CONFLICT (code) DO NOTHING;

-- Grant permissions for roles
GRANT ALL ON TABLE public.departements TO authenticated;
GRANT ALL ON TABLE public.filieres TO authenticated;
GRANT ALL ON TABLE public.classes TO authenticated;
