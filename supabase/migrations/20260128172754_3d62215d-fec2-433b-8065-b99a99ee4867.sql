-- Update default timezone to EST for existing tutors and new ones
ALTER TABLE public.tutor_profiles 
ALTER COLUMN timezone SET DEFAULT 'America/New_York';

-- Set existing NULL timezones to EST
UPDATE public.tutor_profiles 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL OR timezone = 'America/Los_Angeles';

-- Add column to sessions to track which timezone view the student used when booking
ALTER TABLE public.sessions 
ADD COLUMN student_timezone_view text DEFAULT NULL;

COMMENT ON COLUMN public.sessions.student_timezone_view IS 'The timezone the student was viewing when they booked (PST or EST)';