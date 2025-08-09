-- Create kra_purchase_submissions table
CREATE TABLE IF NOT EXISTS kra_purchase_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spplr_invc_no INTEGER NOT NULL,
    spplr_tin VARCHAR(20) NOT NULL,
    spplr_nm VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(10) NOT NULL,
    receipt_type VARCHAR(10) NOT NULL,
    submission_status VARCHAR(20) DEFAULT 'pending' CHECK (submission_status IN ('pending', 'success', 'failed')),
    kra_response JSONB,
    kra_error_message TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(spplr_invc_no, spplr_tin)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kra_purchase_submissions_status ON kra_purchase_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_kra_purchase_submissions_invoice ON kra_purchase_submissions(spplr_invc_no);
CREATE INDEX IF NOT EXISTS idx_kra_purchase_submissions_tin ON kra_purchase_submissions(spplr_tin);
CREATE INDEX IF NOT EXISTS idx_kra_purchase_submissions_submitted_at ON kra_purchase_submissions(submitted_at);

-- Add comments for documentation
COMMENT ON TABLE kra_purchase_submissions IS 'Tracks KRA purchase submissions to prevent duplicates and persist status';
COMMENT ON COLUMN kra_purchase_submissions.spplr_invc_no IS 'Supplier invoice number';
COMMENT ON COLUMN kra_purchase_submissions.spplr_tin IS 'Supplier TIN';
COMMENT ON COLUMN kra_purchase_submissions.submission_status IS 'Status of KRA submission: pending, success, failed';
COMMENT ON COLUMN kra_purchase_submissions.kra_response IS 'Full KRA API response stored as JSON';
COMMENT ON COLUMN kra_purchase_submissions.kra_error_message IS 'Error message if submission failed';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kra_purchase_submissions_updated_at 
    BEFORE UPDATE ON kra_purchase_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 