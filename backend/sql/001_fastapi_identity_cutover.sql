-- Target-state identity cutover for FastAPI-owned auth.
-- Apply this when you are ready to stop using Supabase Auth as the source of truth.
-- Do not run this while the existing frontend still depends on auth.users triggers.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  phone_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.users (id, phone, phone_verified_at, created_at, updated_at)
SELECT
  p.id,
  p.phone,
  NOW(),
  COALESCE(p.created_at, NOW()),
  COALESCE(p.updated_at, NOW())
FROM public.profiles AS p
WHERE p.phone IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
  phone = EXCLUDED.phone,
  updated_at = NOW();

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TABLE IF NOT EXISTS public.auth_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('register', 'login')),
  code_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_auth_otps_phone_purpose
  ON public.auth_otps(phone, purpose, created_at DESC);
