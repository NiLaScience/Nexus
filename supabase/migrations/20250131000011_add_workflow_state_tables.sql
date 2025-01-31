-- Create workflow states table
CREATE TABLE workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jobdescriptionid UUID NOT NULL REFERENCES job_descriptions(id),
    iterationcount INTEGER NOT NULL DEFAULT 0,
    shouldterminate BOOLEAN NOT NULL DEFAULT FALSE,
    currentphase TEXT NOT NULL CHECK (currentphase IN ('INITIAL', 'GENERATING', 'REFINING', 'COMPLETE')),
    scoringcriteria JSONB NOT NULL,
    refinedcriteria JSONB,
    createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(jobdescriptionid)
);


-- Create workflow refinements table
CREATE TABLE workflow_refinements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jobdescriptionid UUID NOT NULL REFERENCES job_descriptions(id),
    iterationnumber INTEGER NOT NULL,
    refinement JSONB NOT NULL,
    createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(jobdescriptionid, iterationnumber)
);

-- Add indexes for performance
CREATE INDEX idx_workflow_states_job_id ON workflow_states(jobdescriptionid);

CREATE INDEX idx_workflow_refinements_job_id ON workflow_refinements(jobdescriptionid);
CREATE INDEX idx_workflow_refinements_iteration ON workflow_refinements(jobdescriptionid, iterationnumber);

-- Add trigger to update updatedat column
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflow_states_updated_at
    BEFORE UPDATE ON workflow_states
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_updated_at(); 