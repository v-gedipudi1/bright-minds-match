-- Create trigger to automatically update tutor rating when reviews are added/updated/deleted
CREATE OR REPLACE FUNCTION public.update_tutor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    avg_rating NUMERIC;
    review_count INTEGER;
    target_tutor_id UUID;
BEGIN
    -- Determine which tutor to update
    IF TG_OP = 'DELETE' THEN
        target_tutor_id := OLD.tutor_id;
    ELSE
        target_tutor_id := NEW.tutor_id;
    END IF;
    
    -- Calculate new average rating and count
    SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO avg_rating, review_count
    FROM reviews
    WHERE tutor_id = target_tutor_id;
    
    -- Update tutor profile
    UPDATE tutor_profiles 
    SET rating = ROUND(avg_rating, 2),
        total_reviews = review_count
    WHERE user_id = target_tutor_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tutor_rating();

-- Fix existing data - update tutor ratings based on existing reviews
UPDATE tutor_profiles tp
SET rating = COALESCE(sub.avg_rating, 0),
    total_reviews = COALESCE(sub.review_count, 0)
FROM (
    SELECT tutor_id, ROUND(AVG(rating), 2) as avg_rating, COUNT(*) as review_count
    FROM reviews
    GROUP BY tutor_id
) sub
WHERE tp.user_id = sub.tutor_id;