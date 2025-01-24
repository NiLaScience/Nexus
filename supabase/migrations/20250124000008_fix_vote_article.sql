-- Fix ambiguous column references in vote_article function
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
    values (vote_article.article_id, auth.uid(), vote_article.vote_type);

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count + case when vote_article.vote_type = 'up' then 1 else 0 end,
      downvote_count = downvote_count + case when vote_article.vote_type = 'down' then 1 else 0 end
    where id = vote_article.article_id;
  elsif existing_vote != vote_article.vote_type then
    -- Change vote
    update article_votes
    set vote_type = vote_article.vote_type
    where article_id = vote_article.article_id
    and user_id = auth.uid();

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count + case when vote_article.vote_type = 'up' then 1 else -1 end,
      downvote_count = downvote_count + case when vote_article.vote_type = 'down' then 1 else -1 end
    where id = vote_article.article_id;
  else
    -- Remove vote
    delete from article_votes
    where article_id = vote_article.article_id
    and user_id = auth.uid();

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count - case when vote_article.vote_type = 'up' then 1 else 0 end,
      downvote_count = downvote_count - case when vote_article.vote_type = 'down' then 1 else 0 end
    where id = vote_article.article_id;
  end if;
end;
$$ language plpgsql security definer; 