-- Create participant_funding table
CREATE TABLE participant_funding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,
  funding_source TEXT NOT NULL CHECK (funding_source IN ('NDIS', 'Private', 'State Funding')),
  funding_type TEXT NOT NULL CHECK (funding_type IN ('Core Supports', 'Capacity Building', 'Capital Supports', 'Support Services')),
  registration_number TEXT UNIQUE,
  invoice_recipient TEXT,
  allocated_amount DECIMAL(12, 2) NOT NULL,
  used_amount DECIMAL(12, 2) DEFAULT 0,
  remaining_amount DECIMAL(12, 2),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Near Depletion', 'Expired', 'Inactive')),
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE participant_funding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON participant_funding
  FOR ALL USING (true);

-- Create funding_claims table to track individual claims
CREATE TABLE funding_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  funding_id UUID REFERENCES participant_funding(id) ON DELETE CASCADE NOT NULL,
  claim_date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Paid', 'Rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE funding_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON funding_claims
  FOR ALL USING (true);

-- Create funding_invoices table to track invoices
CREATE TABLE funding_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  funding_id UUID REFERENCES participant_funding(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE funding_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON funding_invoices
  FOR ALL USING (true);
