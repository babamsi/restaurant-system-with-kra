-- Create branch_users table
CREATE TABLE IF NOT EXISTS branch_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userId VARCHAR(255) NOT NULL UNIQUE,
    userNm VARCHAR(255) NOT NULL,
    pwd VARCHAR(255) NOT NULL,
    adrs TEXT,
    cntc VARCHAR(255),
    authCd VARCHAR(255),
    remark TEXT,
    useYn VARCHAR(1) DEFAULT 'Y',
    regrNm VARCHAR(255) DEFAULT 'Admin',
    regrId VARCHAR(255) DEFAULT 'Admin',
    modrNm VARCHAR(255) DEFAULT 'Admin',
    modrId VARCHAR(255) DEFAULT 'Admin',
    kra_status VARCHAR(50),
    kra_submission_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on userId for faster lookups
CREATE INDEX IF NOT EXISTS idx_branch_users_user_id ON branch_users(userId);

-- Create index on kra_status for filtering
CREATE INDEX IF NOT EXISTS idx_branch_users_kra_status ON branch_users(kra_status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_branch_users_updated_at 
    BEFORE UPDATE ON branch_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 