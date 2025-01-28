-- Add job_description_id column to candidate_feedback table
alter table "public"."candidate_feedback"
add column "job_description_id" uuid references job_descriptions(id) on delete cascade;

-- Backfill job_description_id from candidate_profiles
update "public"."candidate_feedback" cf
set job_description_id = cp.job_description_id
from "public"."candidate_profiles" cp
where cf.candidate_id = cp.id;

-- Make job_description_id not null after backfill
alter table "public"."candidate_feedback"
alter column "job_description_id" set not null;

-- Create index for better query performance
create index "candidate_feedback_job_description_id_idx" on "public"."candidate_feedback" ("job_description_id"); 