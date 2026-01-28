-- Add timezone column to tutor_profiles
ALTER TABLE public.tutor_profiles 
ADD COLUMN timezone text DEFAULT 'America/Los_Angeles';

-- Add comment for documentation
COMMENT ON COLUMN public.tutor_profiles.timezone IS 'Tutor timezone (e.g., America/Los_Angeles for PST, America/New_York for EST)';