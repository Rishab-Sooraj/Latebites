-- Fix handle_new_user function - remove dependency on non-existent admins table
-- This prevents the "Database error saving new user" issue

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create customer profile if email doesn't end with @latebites.in (admin domain)
  IF NEW.email NOT LIKE '%@latebites.in' THEN
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
