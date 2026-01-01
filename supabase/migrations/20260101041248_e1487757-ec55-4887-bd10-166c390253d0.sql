-- Add meeting_link column to sessions table for video call links
ALTER TABLE public.sessions 
ADD COLUMN meeting_link text;

-- Add comment for documentation
COMMENT ON COLUMN public.sessions.meeting_link IS 'Video meeting link (Zoom, Google Meet, etc.) added by tutor after payment confirmed';