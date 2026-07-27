'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TableStatus {
  exists: boolean
  count?: number
  error?: string
}

interface SetupStatus {
  ready: boolean
  tables: Record<string, TableStatus>
  nextStep: string
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/setup')
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { checkStatus() }, [])

  const sqlContent = `-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/wrygolugpadusluvlxqf/sql/new

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DROP TABLE IF EXISTS public.case_notes CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.animals CASCADE;
DROP TABLE IF EXISTS public.doctor_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT, full_name TEXT,
  role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer','doctor','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.doctor_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL, university TEXT NOT NULL,
  graduation_year INTEGER NOT NULL, pvmc_number TEXT NOT NULL,
  clinic_name TEXT, city TEXT NOT NULL,
  degree_certificate_url TEXT, pvmc_certificate_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  rejection_reason TEXT, reviewed_by UUID, reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.animals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_type TEXT NOT NULL, name TEXT, tag_number TEXT,
  age_years INTEGER, age_months INTEGER, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
  symptoms_checklist TEXT[] DEFAULT '{}', symptoms_freetext TEXT,
  symptom_photo_url TEXT, ai_possible_conditions TEXT, ai_urgency_level TEXT,
  ai_first_aid TEXT, ai_disclaimer TEXT, ai_raw_response TEXT,
  ai_language TEXT DEFAULT 'en', status TEXT NOT NULL DEFAULT 'open',
  assigned_doctor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.case_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('farmer','doctor')),
  content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "p_select" ON public.profiles FOR SELECT USING (auth.uid()=id);
CREATE POLICY "p_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid()=id);
CREATE POLICY "p_update" ON public.profiles FOR UPDATE USING (auth.uid()=id);
CREATE POLICY "dp_select" ON public.doctor_profiles FOR SELECT USING (auth.uid()=id);
CREATE POLICY "a_select" ON public.animals FOR SELECT USING (auth.uid()=owner_id);
CREATE POLICY "c_farmer" ON public.cases FOR SELECT USING (auth.uid()=farmer_id);
CREATE POLICY "c_doctor" ON public.cases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.id=auth.uid() AND dp.status='verified')
);
CREATE POLICY "cn_farmer" ON public.case_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id=case_id AND c.farmer_id=auth.uid())
);
CREATE POLICY "cn_doctor" ON public.case_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.id=auth.uid() AND dp.status='verified')
);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id,email,full_name,role) VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.raw_user_meta_data->>'role','farmer')
  ) ON CONFLICT (id) DO UPDATE SET
    email=EXCLUDED.email,
    full_name=COALESCE(NULLIF(EXCLUDED.full_name,''),public.profiles.full_name),
    role=COALESCE(NULLIF(EXCLUDED.role,''),public.profiles.role,'farmer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at=NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_doctor BEFORE UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_animals BEFORE UPDATE ON public.animals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_cases BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.profiles (id,email,full_name,role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name',email,'User'),
  COALESCE(NULLIF(raw_user_meta_data->>'role',''),'farmer')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email=EXCLUDED.email,
  full_name=COALESCE(NULLIF(EXCLUDED.full_name,''),public.profiles.full_name),
  role=COALESCE(NULLIF(EXCLUDED.role,''),public.profiles.role,'farmer');

UPDATE public.profiles SET role='admin' WHERE email='taharashid804@gmail.com';
SELECT id,email,role FROM public.profiles ORDER BY created_at;`

  const copySQL = () => {
    navigator.clipboard.writeText(sqlContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-pk-cream p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐄</div>
          <h1 className="text-3xl font-bold text-pk-dark">Malshifa Setup</h1>
          <p className="text-pk-dark/60 mt-2">Check database status and get setup instructions</p>
        </div>

        {/* Status card */}
        <div className="card shadow-warm-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-pk-dark text-lg">Database Status</h2>
            <button
              onClick={checkStatus}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-pk-green border border-pk-green/30 px-3 py-1.5 rounded-xl hover:bg-pk-green/5 transition-all"
            >
              {loading
                ? <span className="animate-spin rounded-full h-3 w-3 border-2 border-pk-green border-t-transparent" />
                : '🔄'
              }
              Refresh
            </button>
          </div>

          {loading && !status ? (
            <div className="flex items-center gap-3 py-4 text-pk-dark/50">
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-pk-green border-t-transparent" />
              Checking tables...
            </div>
          ) : status ? (
            <>
              <div className={`rounded-xl p-4 mb-4 ${status.ready ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className={`font-bold text-lg ${status.ready ? 'text-green-700' : 'text-red-700'}`}>
                  {status.ready ? '✅ Database is ready!' : '❌ Database setup required'}
                </div>
                <div className={`text-sm mt-1 ${status.ready ? 'text-green-600' : 'text-red-600'}`}>
                  {status.nextStep}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(status.tables).map(([table, info]) => (
                  <div key={table} className={`rounded-xl p-3 border ${info.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-lg mb-1">{info.exists ? '✅' : '❌'}</div>
                    <div className="font-mono text-xs font-bold text-pk-dark">{table}</div>
                    {info.exists && typeof info.count === 'number' && (
                      <div className="text-xs text-pk-dark/50 mt-0.5">{info.count} rows</div>
                    )}
                    {!info.exists && info.error && (
                      <div className="text-xs text-red-600 mt-0.5 truncate" title={info.error}>Not found</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-pk-terra text-sm">Could not connect to database. Check your Supabase credentials.</p>
          )}
        </div>

        {/* SQL to run */}
        {status && !status.ready && (
          <div className="card shadow-warm-lg mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-pk-dark text-lg">📋 SQL to Run</h2>
              <div className="flex gap-2">
                <button
                  onClick={copySQL}
                  className="flex items-center gap-1.5 bg-pk-green text-white text-sm px-4 py-2 rounded-xl hover:bg-pk-green-light transition-all"
                >
                  {copied ? '✓ Copied!' : '📋 Copy SQL'}
                </button>
                <a
                  href="https://supabase.com/dashboard/project/wrygolugpadusluvlxqf/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-pk-green text-pk-green text-sm px-4 py-2 rounded-xl hover:bg-pk-green/5 transition-all"
                >
                  Open Editor ↗
                </a>
              </div>
            </div>
            <ol className="text-sm text-pk-dark/70 space-y-1 mb-4 list-decimal list-inside">
              <li>Click <strong>Copy SQL</strong> above</li>
              <li>Click <strong>Open Editor ↗</strong> to go to Supabase</li>
              <li>Paste in the SQL editor (<strong>Ctrl+V</strong>)</li>
              <li>Click <strong>Run</strong> (green button, top right)</li>
              <li>Come back here and click <strong>Refresh</strong></li>
            </ol>
            <div className="bg-gray-900 rounded-xl p-4 max-h-48 overflow-y-auto">
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{sqlContent.substring(0, 500)}...</pre>
            </div>
          </div>
        )}

        {/* All good */}
        {status?.ready && (
          <div className="card shadow-warm-lg text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-pk-dark mb-2">App is fully set up!</h2>
            <p className="text-pk-dark/60 text-sm mb-6">All database tables are ready. You can now use the app.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/" className="btn-primary">← Go to App</Link>
              <Link href="/admin" className="btn-outline">Admin Panel</Link>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-pk-green text-sm hover:underline">← Back to Malshifa</Link>
        </div>
      </div>
    </div>
  )
}
