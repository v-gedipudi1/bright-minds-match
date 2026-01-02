-- Update the public_profiles view to show all profiles for messaging purposes
-- Drop and recreate the view to include all users (not just tutors)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  bio,
  role,
  created_at,
  updated_at
FROM public.profiles;