-- Create the job_descriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    file_path TEXT,
    file_type TEXT,
    raw_content TEXT,
    parsed_content JSONB,
    status TEXT DEFAULT 'pending'
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_descriptions_created_at ON job_descriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions(status);

-- Enable RLS
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for service role" ON job_descriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for service role" ON job_descriptions
    FOR SELECT USING (true);

CREATE POLICY "Enable update for service role" ON job_descriptions
    FOR UPDATE USING (true);
