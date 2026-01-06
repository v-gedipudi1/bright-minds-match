-- Add stripe_account_id to tutor_profiles for Stripe Connect
ALTER TABLE public.tutor_profiles 
ADD COLUMN stripe_account_id TEXT DEFAULT NULL;

-- Add stripe_onboarding_complete to track if onboarding is done
ALTER TABLE public.tutor_profiles 
ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;