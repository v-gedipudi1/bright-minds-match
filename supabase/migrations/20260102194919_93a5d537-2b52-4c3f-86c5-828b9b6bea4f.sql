-- Create a function to update tutor total_sessions when a session is paid
CREATE OR REPLACE FUNCTION public.update_tutor_total_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When status changes to 'confirmed' (paid), increment total_sessions
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        UPDATE tutor_profiles 
        SET total_sessions = total_sessions + 1 
        WHERE user_id = NEW.tutor_id;
    END IF;
    
    -- If status changes from 'confirmed' to something else (e.g., cancelled), decrement
    IF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
        UPDATE tutor_profiles 
        SET total_sessions = GREATEST(0, total_sessions - 1) 
        WHERE user_id = NEW.tutor_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on sessions table
DROP TRIGGER IF EXISTS trigger_update_tutor_sessions ON public.sessions;
CREATE TRIGGER trigger_update_tutor_sessions
    AFTER UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tutor_total_sessions();

-- Fix existing data: Update total_sessions for all tutors based on current confirmed sessions
UPDATE tutor_profiles tp
SET total_sessions = (
    SELECT COUNT(*) 
    FROM sessions s 
    WHERE s.tutor_id = tp.user_id 
    AND s.status = 'confirmed'
);