-- This trigger automatically creates a customer profile when a new user signs up
-- Run this SQL in Supabase SQL Editor

-- First, create the function that will be triggered
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.customers (id, email, name, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.customers TO supabase_auth_admin;

-- Also add RLS policies for customers table to allow reading
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow service role to do anything
CREATE POLICY "Service role can do anything" ON public.customers
  FOR ALL USING (true) WITH CHECK (true);

-- Sync existing auth users to customers table (one-time migration)
INSERT INTO public.customers (id, email, name, phone)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'phone', '')
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = au.id)
ON CONFLICT (id) DO NOTHING;
