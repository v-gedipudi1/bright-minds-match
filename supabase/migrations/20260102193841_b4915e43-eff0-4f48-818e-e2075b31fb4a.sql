-- Fix: Set the view to use invoker's permissions (not security definer)
-- This allows the view to respect RLS policies of the underlying table

-- First drop the existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Create the view with security_invoker = true (default in recent Postgres)
-- This makes it use the caller's permissions instead of the definer's
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
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

-- Now we need to update the RLS policy on profiles to allow authenticated users 
-- to see basic profile info for messaging purposes
-- Drop the restrictive policy and replace with one that allows viewing profiles of conversation participants

-- Update the "Anyone can view public profiles" policy to allow seeing all profiles for authenticated users
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles for messaging" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
);