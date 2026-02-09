-- Fix handle_new_user function to generate unique placeholder phone numbers
-- This prevents UNIQUE constraint violations when phone is not provided

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create customer profile if:
  -- 1. Email doesn't end with @latebites.in (admin domain)
  -- 2. User is not in the admins table
  IF NEW.email NOT LIKE '%@latebites.in' 
     AND NOT EXISTS (SELECT 1 FROM admins WHERE id = NEW.id) 
  THEN
    INSERT INTO public.customers (
      id,
      email,
      name,
      phone
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      -- Generate unique placeholder phone if not provided
      -- Use user ID to ensure uniqueness
      COALESCE(NEW.raw_user_meta_data->>'phone', '+91' || substring(replace(NEW.id::text, '-', ''), 1, 10))
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
