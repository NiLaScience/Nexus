-- Add workflow_type column to job_descriptions
ALTER TABLE job_descriptions
ADD COLUMN workflow_type TEXT DEFAULT 'langgraph' CHECK (workflow_type IN ('langgraph', 'ai_sdk'));

-- Add index for workflow_type
CREATE INDEX idx_job_descriptions_workflow_type ON job_descriptions(workflow_type); 