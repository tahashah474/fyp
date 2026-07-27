-- ============================================================
-- RLS FIX — Run this in Supabase SQL Editor
-- Fixes: "new row violates row-level security policy"
-- ============================================================

-- 1. Drop all existing broken policies
DROP POLICY IF EXISTS "doctor_profiles_select_own" ON public.doctor_profiles;
DROP POLICY IF EXISTS "doctor_profiles_insert_own" ON public.doctor_profiles;
DROP POLICY IF EXISTS "doctor_profiles_update_own" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can view own doctor profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can insert own doctor profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Doctors can update own doctor profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Admin can manage all doctor profiles" ON public.doctor_profiles;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "animals_owner_all" ON public.animals;
DROP POLICY IF EXISTS "Farmers can CRUD own animals" ON public.animals;
DROP POLICY IF EXISTS "Doctors can view animals in their cases" ON public.animals;

DROP POLICY IF EXISTS "cases_farmer_all" ON public.cases;
DROP POLICY IF EXISTS "cases_doctor_select" ON public.cases;
DROP POLICY IF EXISTS "cases_doctor_update" ON public.cases;
DROP POLICY IF EXISTS "Farmers can CRUD own cases" ON public.cases;
DROP POLICY IF EXISTS "Verified doctors can view open cases" ON public.cases;
DROP POLICY IF EXISTS "Verified doctors can update assigned cases" ON public.cases;
DROP POLICY IF EXISTS "Admin can manage all cases" ON public.cases;

DROP POLICY IF EXISTS "case_notes_farmer" ON public.case_notes;
DROP POLICY IF EXISTS "case_notes_doctor" ON public.case_notes;
DROP POLICY IF EXISTS "Farmers can manage notes on own cases" ON public.case_notes;
DROP POLICY IF EXISTS "Doctors can manage notes on assigned cases" ON public.case_notes;

-- 2. Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES — simple, no self-reference (that caused the recursion)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. DOCTOR_PROFILES — simple auth.uid() check only
CREATE POLICY "doctor_profiles_select" ON public.doctor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "doctor_profiles_insert" ON public.doctor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "doctor_profiles_update" ON public.doctor_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. ANIMALS
CREATE POLICY "animals_all" ON public.animals
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 6. CASES — farmers own their cases, doctors can read/update all
CREATE POLICY "cases_farmer_all" ON public.cases
  FOR ALL USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY "cases_doctor_read" ON public.cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = auth.uid() AND dp.status = 'verified'
    )
  );

CREATE POLICY "cases_doctor_update" ON public.cases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = auth.uid() AND dp.status = 'verified'
    )
  );

-- 7. CASE NOTES
CREATE POLICY "notes_farmer" ON public.case_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id AND c.farmer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id AND c.farmer_id = auth.uid()
    )
  );

CREATE POLICY "notes_doctor" ON public.case_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = auth.uid() AND dp.status = 'verified'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      WHERE dp.id = auth.uid() AND dp.status = 'verified'
    )
  );

-- 8. Verify tables exist (create if missing)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
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

CREATE TABLE IF NOT EXISTS public.animals (
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

CREATE TABLE IF NOT EXISTS public.cases (
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
  status TEXT NOT NULL DEFAULT 'open',
  assigned_doctor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Sync existing users into profiles (in case trigger missed them)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
  COALESCE(raw_user_meta_data->>'role', 'farmer')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  role = COALESCE(
    NULLIF(EXCLUDED.role, ''),
    public.profiles.role,
    'farmer'
  );

-- 10. Set your admin account
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'taharashid804@gmail.com';
