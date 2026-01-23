-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

-- Recreate the policy using the security definer function to avoid recursion
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Also add a policy for founders to view all roles
CREATE POLICY "Founders can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (is_founder(auth.uid()));