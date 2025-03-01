ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON auth.users(stripe_customer_id);