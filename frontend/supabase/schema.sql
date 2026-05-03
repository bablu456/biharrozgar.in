-- Bihar Rozgar Portal - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('seeker', 'employer', 'admin')) DEFAULT 'seeker',
  avatar_url TEXT,
  resume_url TEXT,
  resume_parsed JSONB,
  district VARCHAR(100),
  bio TEXT,
  skills TEXT[],
  experience_years INTEGER,
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  whatsapp_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  premium_plan VARCHAR(50),
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  category VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship', 'daily-wage')) NOT NULL,
  district VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  locality VARCHAR(255),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_type VARCHAR(20) CHECK (salary_type IN ('monthly', 'daily', 'hourly')),
  is_fresher_friendly BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  application_method VARCHAR(20) CHECK (application_method IN ('whatsapp', 'form', 'email')) DEFAULT 'whatsapp',
  whatsapp_number VARCHAR(20),
  application_link TEXT,
  apply_instructions TEXT,
  views_count INTEGER DEFAULT 0,
  applicants_count INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'shortlisted', 'rejected', 'hired')) DEFAULT 'pending',
  cover_letter TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- 4. JOB_ALERTS TABLE
CREATE TABLE IF NOT EXISTS job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  keywords VARCHAR(255),
  district VARCHAR(100),
  category VARCHAR(100),
  job_type VARCHAR(50),
  salary_min INTEGER,
  frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly')) DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  features JSONB,
  job_id UUID REFERENCES jobs(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CATEGORIES SEED DATA
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name_hi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  slug VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO categories (name_hi, name_en, icon, slug) VALUES
  ('कोचिंग और ट्यूशन', 'Coaching & Tutoring', 'GraduationCap', 'coaching'),
  ('रेटेल और सेल्स', 'Retail & Sales', 'ShoppingBag', 'retail'),
  ('सेवाएं', 'Services', 'Briefcase', 'services'),
  ('दैनिक मजदूरी', 'Daily Wage', 'Clock', 'daily-wage'),
  ('टेक और आईटी', 'Tech & IT', 'Laptop', 'tech'),
  ('सरकारी नौकरी', 'Government', 'Building2', 'government'),
  ('डिलीवरी', 'Delivery', 'Truck', 'delivery'),
  ('सुरक्षा', 'Security', 'Shield', 'security'),
  ('स्वास्थ्य सेवा', 'Healthcare', 'Heart', 'healthcare'),
  ('आतिथ्य', 'Hospitality', 'Hotel', 'hospitality'),
  ('फैक्ट्री और विनिर्माण', 'Factory & Manufacturing', 'Factory', 'factory'),
  ('अन्य', 'Other', 'MoreHorizontal', 'other')
ON CONFLICT (slug) DO NOTHING;

-- 7. DISTRICTS SEED DATA (Bihar)
CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO districts (name, slug) VALUES
  ('Patna', 'patna'), ('Gaya', 'gaya'), ('Bhagalpur', 'bhagalpur'),
  ('Muzaffarpur', 'muzaffarpur'), ('Darbhanga', 'darbhanga'),
  ('Bihar Sharif', 'bihar-sharif'), ('Purnia', 'purnia'), ('Katihar', 'katihar'),
  ('Saharsa', 'saharsa'), ('Hazipur', 'hajipur'), ('Chapra', 'chapra'),
  ('Motihari', 'motihari'), ('Bettiah', 'bettiah'), ('Bagaha', 'bagaha'),
  ('Siwan', 'siwan'), ('Gopalganj', 'gopalganj'), ('Nalanda', 'nalanda'),
  ('Nawada', 'nawada'), ('Jehanabad', 'jehanabad'), ('Aurangabad', 'aurangabad'),
  ('Madhubani', 'madhubani'), ('Samastipur', 'samastipur'), ('Begusarai', 'begusarai'),
  ('Jamui', 'jamui'), ('Kishanganj', 'kishanganj'), ('Araria', 'araria'),
  ('Supaul', 'supaul'), ('Madhepura', 'madhepura'), ('Khagaria', 'khagaria'),
  ('Munger', 'munger'), ('Lakhisarai', 'lakhisarai'), ('Sheikhpura', 'sheikhpura'),
  ('Kaimur', 'kaimur'), ('Rohtas', 'rohtas'), ('Buxar', 'buxar'),
  ('Vaishali', 'vaishali'), ('Saran', 'saran')
ON CONFLICT (slug) DO NOTHING;

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- JOBS POLICIES
CREATE POLICY "Public can view approved jobs" ON jobs FOR SELECT USING (status = 'approved');
CREATE POLICY "Employers can insert own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Employers can update own jobs" ON jobs FOR UPDATE USING (auth.uid() = employer_id);
CREATE POLICY "Employers can delete own jobs" ON jobs FOR DELETE USING (auth.uid() = employer_id);

-- APPLICATIONS POLICIES
CREATE POLICY "Applicants view own applications" ON applications FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Applicants can insert own applications" ON applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- JOB_ALERTS POLICIES
CREATE POLICY "Users manage own alerts" ON job_alerts FOR ALL USING (auth.uid() = user_id);

-- PAYMENTS POLICIES
CREATE POLICY "Users view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages payments" ON payments FOR ALL USING (auth.role() = 'service_role');

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('resumes', 'resumes', true),
  ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Users can upload resumes" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view resumes" ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes');

CREATE POLICY "Users can upload company logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view company logos" ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- AUTO-CREATE PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'seeker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FUNCTION TO INCREMENT JOB VIEWS
CREATE OR REPLACE FUNCTION increment_job_views(job_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE jobs SET views_count = views_count + 1 WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_district ON jobs(district);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user ON job_alerts(user_id);

-- GRANT PERMISSIONS
GRANT SELECT ON categories TO public;
GRANT SELECT ON districts TO public;