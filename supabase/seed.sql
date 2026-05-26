-- Histyon — Local Development Seed
-- Runs automatically after `supabase db reset`.
-- Creates a local admin user for testing the ops console.
--
-- Login: admin@histyon.local / Admin1234!
-- (change password immediately if promoting to a real environment)

DO $$
DECLARE
  v_uid uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert into auth.users only if not already present
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid) THEN
    INSERT INTO auth.users (
      id, email, email_confirmed_at, created_at, updated_at,
      role, aud, encrypted_password,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      v_uid,
      'admin@histyon.local',
      NOW(), NOW(), NOW(),
      'authenticated', 'authenticated',
      -- bcrypt of 'Admin1234!' — ONLY for local dev
      '$2a$10$PBcfHBvgJuEBDjnEjrLzfOetNLbLbfxD3r2h1wXGwZhxdKOgK.M2u',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false
    );
  END IF;

  -- Upsert the profile
  INSERT INTO public.profiles (id, email, first_name, last_name, role, status, created_at)
  VALUES (v_uid, 'admin@histyon.local', 'Admin', 'Local', 'admin', 'approved', NOW())
  ON CONFLICT (id) DO UPDATE
    SET role = 'admin', status = 'approved';
END $$;
