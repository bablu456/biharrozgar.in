-- Allow the shared OTP challenge table to store normalized email addresses.
ALTER TABLE public.auth_otps
  ALTER COLUMN phone TYPE VARCHAR(255);
