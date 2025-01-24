-- Fix ambiguous parameter references in vote_article function
drop function if exists vote_article(uuid, text);

create or replace function vote_article(
  target_article_id uuid,
  target_vote_type text
) returns void as $$
declare
  existing_vote text;
begin
  -- Check if user has already voted
  select av.vote_type into existing_vote
  from article_votes av
  where av.article_id = target_article_id
  and av.user_id = auth.uid();

  if existing_vote is null then
    -- Insert new vote
    insert into article_votes (article_id, user_id, vote_type)
    values (target_article_id, auth.uid(), target_vote_type);

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count + case when target_vote_type = 'up' then 1 else 0 end,
      downvote_count = downvote_count + case when target_vote_type = 'down' then 1 else 0 end
    where id = target_article_id;
  elsif existing_vote != target_vote_type then
    -- Change vote
    update article_votes
    set vote_type = target_vote_type
    where article_id = target_article_id
    and user_id = auth.uid();

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count + case when target_vote_type = 'up' then 1 else -1 end,
      downvote_count = downvote_count + case when target_vote_type = 'down' then 1 else -1 end
    where id = target_article_id;
  else
    -- Remove vote
    delete from article_votes
    where article_id = target_article_id
    and user_id = auth.uid();

    -- Update vote counts
    update articles
    set 
      upvote_count = upvote_count - case when target_vote_type = 'up' then 1 else 0 end,
      downvote_count = downvote_count - case when target_vote_type = 'down' then 1 else 0 end
    where id = target_article_id;
  end if;
end;
$$ language plpgsql security definer; 