-- Update handle_new_user function to include phone_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, role, phone_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student'),
        NEW.raw_user_meta_data ->> 'phone_number'
    );
    
    -- Create student profile if role is student
    IF COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student') = 'student' THEN
        INSERT INTO public.student_profiles (user_id) VALUES (NEW.id);
    END IF;
    
    -- Create tutor profile if role is tutor
    IF (NEW.raw_user_meta_data ->> 'role')::user_role = 'tutor' THEN
        INSERT INTO public.tutor_profiles (user_id) VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$function$;