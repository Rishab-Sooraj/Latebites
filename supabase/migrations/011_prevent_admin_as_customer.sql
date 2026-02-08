-- Update the auto-create customer profile function to exclude admin emails
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
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
