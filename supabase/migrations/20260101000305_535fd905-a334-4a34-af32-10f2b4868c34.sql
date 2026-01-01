-- Drop the existing check constraint and recreate with new status values
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE public.sessions ADD CONSTRAINT sessions_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'awaiting_payment'));