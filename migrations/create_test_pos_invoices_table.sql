-- Create test_pos_invoices table for KRA test POS sales
CREATE TABLE IF NOT EXISTS test_pos_invoices (
  id SERIAL PRIMARY KEY,
  trdInvcNo INTEGER UNIQUE NOT NULL,
  invcNo INTEGER NOT NULL,
  orgInvcNo INTEGER DEFAULT 0,
  custTin VARCHAR(20),
  custNm VARCHAR(255) NOT NULL,
  salesTyCd VARCHAR(10) DEFAULT 'N',
  rcptTyCd VARCHAR(10) DEFAULT 'S',
  pmtTyCd VARCHAR(10) DEFAULT '01',
  salesSttsCd VARCHAR(10) DEFAULT '02',
  cfmDt VARCHAR(14) NOT NULL,
  salesDt VARCHAR(8) NOT NULL,
  totItemCnt INTEGER NOT NULL,
  taxblAmtB DECIMAL(10,2) DEFAULT 0,
  taxRtB INTEGER DEFAULT 16,
  taxAmtB DECIMAL(10,2) DEFAULT 0,
  totTaxblAmt DECIMAL(10,2) NOT NULL,
  totTaxAmt DECIMAL(10,2) NOT NULL,
  prchrAcptcYn VARCHAR(1) DEFAULT 'N',
  totAmt DECIMAL(10,2) NOT NULL,
  totDcAmt DECIMAL(10,2) DEFAULT 0,
  totDcRt DECIMAL(5,2) DEFAULT 0,
  kra_status VARCHAR(20) DEFAULT 'pending',
  kra_response JSONB,
  kra_curRcptNo VARCHAR(50),
  kra_intrlData VARCHAR(255),
  kra_rcptSign VARCHAR(255),
  kra_sdcDateTime VARCHAR(14),
  items JSONB,
  stock_out_results JSONB,
  stock_out_processed BOOLEAN DEFAULT FALSE,
  stock_out_timestamp TIMESTAMP WITH TIME ZONE,
  -- Refund related columns
  refund_trdInvcNo VARCHAR(20),
  refund_invcNo INTEGER,
  refund_kra_response JSONB,
  refund_timestamp TIMESTAMP WITH TIME ZONE,
  original_receipt_no VARCHAR(50),
  is_refund BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_pos_invoices_trdInvcNo ON test_pos_invoices(trdInvcNo);
CREATE INDEX IF NOT EXISTS idx_test_pos_invoices_kra_status ON test_pos_invoices(kra_status);
CREATE INDEX IF NOT EXISTS idx_test_pos_invoices_created_at ON test_pos_invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_test_pos_invoices_stock_out_processed ON test_pos_invoices(stock_out_processed);
CREATE INDEX IF NOT EXISTS idx_test_pos_invoices_is_refund ON test_pos_invoices(is_refund); 