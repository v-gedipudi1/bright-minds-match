-- Add a policy to allow anyone (including unauthenticated users) to view profiles
-- This enables the public_profiles view to return data for logged-out users
CREATE POLICY "Anyone can view public profile info" 
ON public.profiles 
FOR SELECT 
USING (true);