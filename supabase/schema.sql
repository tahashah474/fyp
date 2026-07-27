-- ============================================================
-- Malshifa Database Schema — FIXED (drop & recreate)
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP existing tables (clean slate)
-- ============================================================
DROP TABLE IF EXISTS public.case_notes CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.animals CASCADE;
DROP TABLE IF EXISTS public.doctor_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'doctor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCTOR PROFILES TABLE
-- ============================================================
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

-- ============================================================
-- ANIMALS TABLE
-- ============================================================
CREATE TABLE public.animals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_type TEXT NOT NULL CHECK (animal_type IN ('cow', 'buffalo', 'goat', 'sheep', 'poultry', 'horse')),
  name TEXT,
  tag_number TEXT,
  age_years INTEGER,
  age_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CASES TABLE
-- ============================================================
CREATE TABLE public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  farmer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  symptoms_checklist TEXT[] DEFAULT '{}',
  symptoms_freetext TEXT,
  symptom_photo_url TEXT,
  ai_possible_conditions TEXT,
  ai_urgency_level TEXT CHECK (ai_urgency_level IN ('Emergency', 'See a vet soon', 'Monitor at home')),
  ai_first_aid TEXT,
  ai_disclaimer TEXT,
  ai_raw_response TEXT,
  ai_language TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
  assigned_doctor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CASE NOTES TABLE
-- ============================================================
CREATE TABLE public.case_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('farmer', 'doctor')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES RLS
-- CRITICAL: Do NOT reference profiles table inside profiles policies
-- Use auth.uid() only to avoid infinite recursion
-- ============================================================
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- DOCTOR PROFILES RLS
-- ============================================================
CREATE POLICY "doctor_profiles_select_own" ON public.doctor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "doctor_profiles_insert_own" ON public.doctor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "doctor_profiles_update_own" ON public.doctor_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role full access (for admin API routes)
-- This is handled by using the service role key server-side

-- ============================================================
-- ANIMALS RLS
-- ============================================================
CREATE POLICY "animals_owner_all" ON public.animals
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================================
-- CASES RLS
-- ============================================================
CREATE POLICY "cases_farmer_all" ON public.cases
  FOR ALL USING (auth.uid() = farmer_id);

-- Doctors can read all open/assigned cases
CREATE POLICY "cases_doctor_select" ON public.cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = auth.uid() AND dp.status = 'verified'
    )
  );

-- Doctors can update cases (take case / mark resolved)
CREATE POLICY "cases_doctor_update" ON public.cases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = auth.uid() AND dp.status = 'verified'
    )
  );

-- ============================================================
-- CASE NOTES RLS
-- ============================================================
-- Farmers can manage notes on their own cases
CREATE POLICY "case_notes_farmer" ON public.case_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id AND c.farmer_id = auth.uid()
    )
  );

-- Doctors can manage notes on any case (if verified)
CREATE POLICY "case_notes_doctor" ON public.case_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = auth.uid() AND dp.status = 'verified'
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER doctor_profiles_updated_at
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER animals_updated_at
  BEFORE UPDATE ON public.animals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================================
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
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKETS
-- Run these separately if buckets don't exist yet:
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('symptom-photos', 'symptom-photos', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('doctor-certificates', 'doctor-certificates', false) ON CONFLICT DO NOTHING;
