-- Drop the existing policy
drop policy if exists "Anyone can create feedback for public job descriptions" on "public"."candidate_feedback";
drop policy if exists "Allow anonymous feedback" on "public"."candidate_feedback";

-- Make user_id nullable since we want to allow anonymous feedback
alter table "public"."candidate_feedback" alter column user_id drop not null;

-- Create new policy that allows anonymous feedback
create policy "Allow anonymous feedback"
on "public"."candidate_feedback"
for insert
to public
with check (true);

-- Grant insert permissions to the anonymous role
grant insert on "public"."candidate_feedback" to anon; 
