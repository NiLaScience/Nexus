-- Drop existing table and related objects
DROP TABLE IF EXISTS job_descriptions CASCADE;

-- Recreate the table
CREATE TABLE job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    file_path TEXT,
    file_type TEXT,
    raw_content TEXT,
    parsed_content JSONB,
    status TEXT DEFAULT 'pending'
);

-- Add indexes
CREATE INDEX idx_job_descriptions_created_at ON job_descriptions(created_at);
CREATE INDEX idx_job_descriptions_status ON job_descriptions(status);

-- Grant permissions
GRANT ALL ON job_descriptions TO postgres, service_role;
GRANT ALL ON job_descriptions TO anon;
GRANT ALL ON job_descriptions TO authenticated;

-- Enable RLS
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for service role" ON job_descriptions
    FOR ALL USING (true) WITH CHECK (true);
