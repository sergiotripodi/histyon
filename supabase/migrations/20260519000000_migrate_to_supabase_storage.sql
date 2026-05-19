-- =============================================================================
-- MIGRATION: All-in su Supabase Storage
-- Rimozione Cloudflare R2 - Schema ottimizzato per Digital Pathology
-- =============================================================================

-- ─── 1. TICKETS TABLE ────────────────────────────────────────────────────────

-- Rimuovi campi deprecati
ALTER TABLE public.tickets DROP COLUMN IF EXISTS file_name;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS qupath_project;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS output_region;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS output_file_size;

-- Rinomina ai_results → tissue (semantica più chiara)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'ai_results'
  ) THEN
    ALTER TABLE public.tickets RENAME COLUMN ai_results TO tissue;
  END IF;
END $$;

-- Aggiungi campo annotations per dati vettoriali AI (poligoni, maschere)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS annotations JSONB;

-- Assicura che tissue esista (se non rinominato perché non c'era ai_results)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS tissue JSONB;

-- I path di storage ora puntano a Supabase Storage (non più R2)
-- input_file  → path nel bucket 'scottea-input'  es. {userId}/{patientId}/{ticketId}
-- output_dzi  → path nel bucket 'scottea-dzi'    es. {userId}/{patientId}/{ticketId}.dzi
-- (nessuna modifica strutturale al tipo, solo semantica del valore)

-- ─── 2. PATIENTS TABLE ───────────────────────────────────────────────────────

-- Rinomina region → province (normalizzazione semantica)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'region'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'province'
  ) THEN
    ALTER TABLE public.patients RENAME COLUMN region TO province;
  END IF;
END $$;

-- ─── 3. RLS POLICIES ─────────────────────────────────────────────────────────

-- Abilita RLS su tutte le tabelle utente (idempotente)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- DROP e ricrea le policy per patients
DROP POLICY IF EXISTS "patients_select_own"  ON public.patients;
DROP POLICY IF EXISTS "patients_insert_own"  ON public.patients;
DROP POLICY IF EXISTS "patients_update_own"  ON public.patients;
DROP POLICY IF EXISTS "patients_delete_own"  ON public.patients;

CREATE POLICY "patients_select_own" ON public.patients
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "patients_insert_own" ON public.patients
  FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "patients_update_own" ON public.patients
  FOR UPDATE USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "patients_delete_own" ON public.patients
  FOR DELETE USING (doctor_id = auth.uid());

-- DROP e ricrea le policy per tickets
DROP POLICY IF EXISTS "tickets_select_own"  ON public.tickets;
DROP POLICY IF EXISTS "tickets_insert_own"  ON public.tickets;
DROP POLICY IF EXISTS "tickets_update_own"  ON public.tickets;
DROP POLICY IF EXISTS "tickets_delete_own"  ON public.tickets;

CREATE POLICY "tickets_select_own" ON public.tickets
  FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "tickets_insert_own" ON public.tickets
  FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "tickets_update_own" ON public.tickets
  FOR UPDATE USING (doctor_id = auth.uid()) WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "tickets_delete_own" ON public.tickets
  FOR DELETE USING (doctor_id = auth.uid());

-- DROP e ricrea le policy per profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (id = auth.uid());

-- ─── 4. SUPABASE STORAGE BUCKETS ─────────────────────────────────────────────
-- Eseguire manualmente dalla Supabase Dashboard o via API Management se non esistono:
--
-- Bucket: scottea-input  (PRIVATO) – file originali temporanei caricati dai medici
--   • public: false
--   • file_size_limit: 5368709120  (5 GB)
--   • allowed_mime_types: ['application/octet-stream', 'image/tiff', 'image/jpeg', 'image/png', 'image/webp']
--
-- Bucket: scottea-dzi    (PUBBLICO) – tiles DZI generate dall'AI, path UUID-based
--   • public: true
--   • file_size_limit: null (nessun limite lato bucket, controllato dall'AI)
--
-- ─── 5. STORAGE RLS POLICIES ─────────────────────────────────────────────────
-- Da applicare via Supabase Dashboard → Storage → Policies

-- scottea-input: solo il medico proprietario può caricare/leggere/cancellare i propri file
-- Path convention: {userId}/{patientId}/{ticketId}

-- scottea-input SELECT (il service role può sempre leggere, usato dall'AI)
-- scottea-input INSERT: auth.uid()::text = (storage.foldername(name))[1]
-- scottea-input DELETE: auth.uid()::text = (storage.foldername(name))[1]

-- scottea-dzi è pubblico → nessuna policy SELECT necessaria
-- scottea-dzi INSERT/DELETE: solo service role (l'AI usa service role key)

-- ─── 6. INDICI UTILI ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_doctor_id   ON public.tickets(doctor_id);
CREATE INDEX IF NOT EXISTS idx_tickets_patient_id  ON public.tickets(patient_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status      ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id  ON public.patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_tickets_annotations ON public.tickets USING GIN (annotations)
  WHERE annotations IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_tissue      ON public.tickets USING GIN (tissue)
  WHERE tissue IS NOT NULL;
