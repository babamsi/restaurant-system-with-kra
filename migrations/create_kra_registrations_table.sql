-- Create kra_registrations table
CREATE TABLE IF NOT EXISTS kra_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_type VARCHAR(20) NOT NULL CHECK (registration_type IN ('device_init', 'branch_reg')),
    tin VARCHAR(20) NOT NULL,
    bhf_id VARCHAR(10) NOT NULL,
    dvc_srl_no VARCHAR(50),
    dvc_id VARCHAR(50),
    sdc_id VARCHAR(50),
    mrc_no VARCHAR(50),
    cmc_key VARCHAR(100),
    bhf_nm VARCHAR(255),
    bhf_open_dt VARCHAR(20),
    prvnc_nm VARCHAR(100),
    dstrt_nm VARCHAR(100),
    sctr_nm VARCHAR(100),
    loc_desc TEXT,
    hq_yn VARCHAR(5),
    mgr_nm VARCHAR(255),
    mgr_tel_no VARCHAR(20),
    mgr_email VARCHAR(255),
    taxpr_nm VARCHAR(255),
    bsns_actv VARCHAR(255),
    kra_status VARCHAR(20) DEFAULT 'pending',
    kra_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kra_registrations_type ON kra_registrations(registration_type);
CREATE INDEX IF NOT EXISTS idx_kra_registrations_tin ON kra_registrations(tin);
CREATE INDEX IF NOT EXISTS idx_kra_registrations_bhf_id ON kra_registrations(bhf_id);
CREATE INDEX IF NOT EXISTS idx_kra_registrations_status ON kra_registrations(kra_status);

-- Add comments for documentation
COMMENT ON TABLE kra_registrations IS 'Stores KRA device initialization and branch registration details';
COMMENT ON COLUMN kra_registrations.registration_type IS 'Type of registration: device_init or branch_reg';
COMMENT ON COLUMN kra_registrations.dvc_id IS 'KRA device ID returned from registration';
COMMENT ON COLUMN kra_registrations.sdc_id IS 'KRA SDC ID returned from registration';
COMMENT ON COLUMN kra_registrations.mrc_no IS 'KRA MRC number returned from registration';
COMMENT ON COLUMN kra_registrations.cmc_key IS 'KRA CMC key for API authentication';
COMMENT ON COLUMN kra_registrations.kra_response IS 'Full KRA API response stored as JSON';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kra_registrations_updated_at 
    BEFORE UPDATE ON kra_registrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 