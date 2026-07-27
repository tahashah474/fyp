-- ================================================================
-- MALSHIFA — FINAL SETUP SQL
-- Run this ENTIRE file in Supabase SQL Editor (New Query)
-- This replaces everything. Safe to run multiple times.
-- ================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop everything (clean slate)
DROP TABLE IF EXISTS public.case_notes CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.animals CASCADE;
DROP TABLE IF EXISTS public.doctor_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- 3. Create tables

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'doctor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.doctor_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  university TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  pvmc_number TEXT NOT NULL,
  clinic_name TEXT,
  city TEXT NOT NULL,
  degree_certificate_url TEXT,
  pvmc_certificate_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.animals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_type TEXT NOT NULL,
  name TEXT,
  tag_number TEXT,
  age_years INTEGER,
  age_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  symptoms_checklist TEXT[] DEFAULT '{}',
  symptoms_freetext TEXT,
  symptom_photo_url TEXT,
  ai_possible_conditions TEXT,
  ai_urgency_level TEXT,
  ai_first_aid TEXT,
  ai_disclaimer TEXT,
  ai_raw_response TEXT,
  ai_language TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
  assigned_doctor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.case_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('farmer', 'doctor')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — SIMPLE, no self-referencing, no recursion
--    The app uses service_role (admin client) for all writes/sensitive reads.
--    These policies cover direct client reads only.

-- profiles: users read/update only their own row
CREATE POLICY "p_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "p_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "p_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- doctor_profiles: doctors read their own
CREATE POLICY "dp_select" ON public.doctor_profiles FOR SELECT USING (auth.uid() = id);

-- animals: farmers read their own
CREATE POLICY "a_select" ON public.animals FOR SELECT USING (auth.uid() = owner_id);

-- cases: farmers read their own; doctors read verified cases
CREATE POLICY "c_farmer_select" ON public.cases FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "c_doctor_select" ON public.cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.id = auth.uid() AND dp.status = 'verified')
);

-- case_notes: users read notes on their own cases
CREATE POLICY "cn_farmer_select" ON public.case_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.farmer_id = auth.uid())
);
CREATE POLICY "cn_doctor_select" ON public.case_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.id = auth.uid() AND dp.status = 'verified')
);

-- 6. Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name,''), public.profiles.full_name),
    role = COALESCE(NULLIF(EXCLUDED.role,''), public.profiles.role, 'farmer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_doctor_updated BEFORE UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_animals_updated BEFORE UPDATE ON public.animals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_cases_updated BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Sync ALL existing auth users into profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
  COALESCE(NULLIF(raw_user_meta_data->>'role',''), 'farmer')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(NULLIF(EXCLUDED.full_name,''), public.profiles.full_name),
  role = COALESCE(NULLIF(EXCLUDED.role,''), public.profiles.role, 'farmer');

-- 9. Set admin account
UPDATE public.profiles SET role = 'admin' WHERE email = 'taharashid804@gmail.com';

-- 10. Create storage buckets (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('symptom-photos', 'symptom-photos', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('doctor-certificates', 'doctor-certificates', false) ON CONFLICT DO NOTHING;

-- Done! Check your profiles table to verify roles are correct.
SELECT id, email, role FROM public.profiles ORDER BY created_at;
