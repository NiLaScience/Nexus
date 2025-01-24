-- Create knowledge base tables
create table if not exists articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  category_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  view_count integer default 0,
  upvote_count integer default 0,
  downvote_count integer default 0,
  workspace_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid
);

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  workspace_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists article_votes (
  article_id uuid not null references articles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (article_id, user_id)
);

-- Add foreign key constraint
alter table articles
  add constraint articles_category_id_fkey
  foreign key (category_id) references categories(id)
  on delete cascade;

-- Create RLS policies

-- Enable RLS
alter table articles enable row level security;
alter table categories enable row level security;
alter table article_votes enable row level security;

-- Categories policies
create policy "Anyone can view categories"
  on categories for select
  using (true);

create policy "Only admins can manage categories"
  on categories for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Articles policies
create policy "Anyone can view published articles"
  on articles for select
  using (true);

create policy "Only admins can manage articles"
  on articles for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Article votes policies
create policy "Anyone can view article votes"
  on article_votes for select
  using (true);

create policy "Users can vote on articles"
  on article_votes for insert
  with check (auth.uid() = user_id);

create policy "Users can change their own votes"
  on article_votes for update
  using (auth.uid() = user_id);

create policy "Users can remove their votes"
  on article_votes for delete
  using (auth.uid() = user_id);

-- Create function to increment view count
create or replace function increment_article_view_count(article_id uuid)
returns void as $$
begin
  update articles
  set view_count = view_count + 1
  where id = article_id;
end;
$$ language plpgsql security definer;

-- Create function to handle voting
create or replace function vote_article(
  article_id uuid,
  vote_type text
) returns void as $$
declare
  existing_vote text;
begin
  -- Check if user has already voted
  select av.vote_type into existing_vote
  from article_votes av
  where av.article_id = vote_article.article_id
  and av.user_id = auth.uid();

  if existing_vote is null then
    -- Insert new vote
    insert into article_votes (article_id, user_id, vote_type)
    values (article_id, auth.uid(), vote_type);

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count + case when vote_type = 'up' then 1 else 0 end,
      downvote_count = downvote_count + case when vote_type = 'down' then 1 else 0 end
    where id = article_id;
  elsif existing_vote != vote_type then
    -- Change vote
    update article_votes
    set vote_type = vote_article.vote_type
    where article_id = vote_article.article_id
    and user_id = auth.uid();

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count + case when vote_type = 'up' then 1 else -1 end,
      downvote_count = downvote_count + case when vote_type = 'down' then 1 else -1 end
    where id = article_id;
  else
    -- Remove vote
    delete from article_votes
    where article_id = vote_article.article_id
    and user_id = auth.uid();

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count - case when vote_type = 'up' then 1 else 0 end,
      downvote_count = downvote_count - case when vote_type = 'down' then 1 else 0 end
    where id = article_id;
  end if;
end;
$$ language plpgsql security definer; 