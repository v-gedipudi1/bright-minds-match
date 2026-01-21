-- Add phone_number column to profiles table
ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;

-- Add phone_notification_dismissed column to track if user has dismissed the prompt
ALTER TABLE public.profiles ADD COLUMN phone_notification_dismissed BOOLEAN DEFAULT false;