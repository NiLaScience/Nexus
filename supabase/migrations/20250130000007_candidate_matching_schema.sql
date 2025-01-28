-- Enable necessary extensions
create extension if not exists "vector" with schema "public";

-- Create storage bucket for job descriptions
insert into storage.buckets (id, name, public)
values ('job-descriptions', 'job-descriptions', true);

-- Allow public access to job descriptions bucket
create policy "Public Access"
on storage.objects for select
to public
using (bucket_id = 'job-descriptions');

-- Allow authenticated uploads to job descriptions bucket
create policy "Authenticated Uploads"
on storage.objects for insert
to authenticated
with check (bucket_id = 'job-descriptions');

-- Create job descriptions table
create table "public"."job_descriptions" (
  "id" uuid not null default gen_random_uuid(),
  "title" text not null,
  "description" text not null,
  "file_path" text,
  "file_type" text,
  "parsed_text" text not null,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "created_by" uuid references auth.users(id) on delete cascade,
  "organization_id" uuid references organizations(id) on delete cascade,
  "status" text not null default 'active',
  "embedding" vector(1536),
  "is_public" boolean not null default true,

  constraint "job_descriptions_pkey" primary key ("id")
);

-- Create candidate profiles table
create table "public"."candidate_profiles" (
  "id" uuid not null default gen_random_uuid(),
  "job_description_id" uuid references job_descriptions(id) on delete cascade not null,
  "name" text not null,
  "background" text not null,
  "skills" text[] not null default '{}',
  "years_of_experience" integer not null,
  "achievements" text[] not null default '{}',
  "score" numeric not null default 0,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
  "status" text not null default 'pending',
  "judge_evaluation" jsonb,

  constraint "candidate_profiles_pkey" primary key ("id")
);

-- Create user feedback table
create table "public"."candidate_feedback" (
  "id" uuid not null default gen_random_uuid(),
  "candidate_id" uuid references candidate_profiles(id) on delete cascade not null,
  "user_id" uuid references auth.users(id) on delete cascade,
  "is_good_fit" boolean not null,
  "feedback" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint "candidate_feedback_pkey" primary key ("id")
);

-- Create iteration history table for tracking workflow iterations
create table "public"."matching_iterations" (
  "id" uuid not null default gen_random_uuid(),
  "job_description_id" uuid references job_descriptions(id) on delete cascade not null,
  "iteration_number" integer not null,
  "refined_criteria" text not null,
  "feedback_summary" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint "matching_iterations_pkey" primary key ("id")
);

-- Add RLS policies
alter table "public"."job_descriptions" enable row level security;
alter table "public"."candidate_profiles" enable row level security;
alter table "public"."candidate_feedback" enable row level security;
alter table "public"."matching_iterations" enable row level security;

-- Job descriptions policies
create policy "Anyone can view public job descriptions"
on "public"."job_descriptions"
for select using (
  is_public = true
);

create policy "Anyone can create public job descriptions"
on "public"."job_descriptions"
for insert with check (
  is_public = true
);

-- Candidate profiles policies
create policy "Anyone can view candidate profiles for public job descriptions"
on "public"."candidate_profiles"
for select using (
  exists (
    select 1 from job_descriptions
    where job_descriptions.id = candidate_profiles.job_description_id
    and job_descriptions.is_public = true
  )
);

create policy "Anyone can create candidate profiles for public job descriptions"
on "public"."candidate_profiles"
for insert with check (
  exists (
    select 1 from job_descriptions
    where job_descriptions.id = candidate_profiles.job_description_id
    and job_descriptions.is_public = true
  )
);

-- Feedback policies
create policy "Anyone can view feedback for public job descriptions"
on "public"."candidate_feedback"
for select using (
  exists (
    select 1 from candidate_profiles
    join job_descriptions on job_descriptions.id = candidate_profiles.job_description_id
    where candidate_profiles.id = candidate_feedback.candidate_id
    and job_descriptions.is_public = true
  )
);

create policy "Anyone can create feedback for public job descriptions"
on "public"."candidate_feedback"
for insert with check (
  exists (
    select 1 from candidate_profiles
    join job_descriptions on job_descriptions.id = candidate_profiles.job_description_id
    where candidate_profiles.id = candidate_feedback.candidate_id
    and job_descriptions.is_public = true
  )
);

-- Iterations policies
create policy "Anyone can view iterations for public job descriptions"
on "public"."matching_iterations"
for select using (
  exists (
    select 1 from job_descriptions
    where job_descriptions.id = matching_iterations.job_description_id
    and job_descriptions.is_public = true
  )
);

-- Create indexes
create index "job_descriptions_organization_id_idx" on "public"."job_descriptions" ("organization_id");
create index "candidate_profiles_job_description_id_idx" on "public"."candidate_profiles" ("job_description_id");
create index "candidate_feedback_candidate_id_idx" on "public"."candidate_feedback" ("candidate_id");
create index "matching_iterations_job_description_id_idx" on "public"."matching_iterations" ("job_description_id"); 
