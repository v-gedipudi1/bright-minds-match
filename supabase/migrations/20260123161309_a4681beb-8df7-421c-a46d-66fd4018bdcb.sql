-- Create a trigger to assign founder role to researchvenni@gmail.com on signup
CREATE OR REPLACE FUNCTION public.assign_founder_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Assign founder role to researchvenni@gmail.com
    IF NEW.email = 'researchvenni@gmail.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'founder')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_assign_founder
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_founder_role();