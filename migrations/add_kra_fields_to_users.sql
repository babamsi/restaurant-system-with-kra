-- Add KRA status fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kra_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS kra_submission_date TIMESTAMP WITH TIME ZONE;

-- Create index on kra_status for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_kra_status ON users(kra_status); 