-- Create a helper function to check if user is founder
CREATE OR REPLACE FUNCTION public.is_founder(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'founder'
  )
$$;

-- Add RLS policy for founders to UPDATE all tutor profiles
CREATE POLICY "Founders can update any tutor profile"
ON public.tutor_profiles
FOR UPDATE
USING (public.is_founder(auth.uid()));

-- Add RLS policy for founders to view all profiles
CREATE POLICY "Founders can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_founder(auth.uid()));

-- Add RLS policy for founders to UPDATE any profile
CREATE POLICY "Founders can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_founder(auth.uid()));

-- Add RLS policy for founders to view all sessions
CREATE POLICY "Founders can view all sessions"
ON public.sessions
FOR SELECT
USING (public.is_founder(auth.uid()));

-- Add RLS policy for founders to view all messages
CREATE POLICY "Founders can view all messages"
ON public.messages
FOR SELECT
USING (public.is_founder(auth.uid()));

-- Add RLS policy for founders to view all conversations
CREATE POLICY "Founders can view all conversations"
ON public.conversations
FOR SELECT
USING (public.is_founder(auth.uid()));

-- Add RLS policy for founders to view all student profiles
CREATE POLICY "Founders can view all student profiles"
ON public.student_profiles
FOR SELECT
USING (public.is_founder(auth.uid()));

-- Add RLS policy for founders to update any student profile
CREATE POLICY "Founders can update any student profile"
ON public.student_profiles
FOR UPDATE
USING (public.is_founder(auth.uid()));

-- Add RLS policy for founders to view class enrollments
CREATE POLICY "Founders can view all class enrollments"
ON public.class_enrollments
FOR SELECT
USING (public.is_founder(auth.uid()));