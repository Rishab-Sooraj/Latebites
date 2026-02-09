-- Disable the auto-create trigger temporarily
-- Profile creation will be handled by the API instead

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the function but it won't be triggered automatically
-- This prevents the "Database error saving new user" issue
