-- Enable RLS on public_profiles view (if not already) and add public access policy
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Create a policy to allow anyone to view public_profiles
CREATE POLICY "Anyone can view public profiles"
ON public.profiles
FOR SELECT
USING (
  role = 'tutor' OR auth.uid() = user_id
);