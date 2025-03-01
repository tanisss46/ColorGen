-- Add message limit columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS message_limit INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS messages_used INTEGER DEFAULT 0;

-- Update existing pro users
UPDATE public.profiles
SET message_limit = 500, messages_used = 0
WHERE subscription_status = 'pro';