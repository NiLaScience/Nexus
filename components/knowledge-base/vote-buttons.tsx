'use client';

import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { voteArticle } from '@/app/actions/articles/articles.server';
import { useState } from 'react';

export interface VoteButtonsProps {
  articleId: string;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
}

export function VoteButtons({ articleId, upvotes: initialUpvotes, downvotes: initialDownvotes, userVote: initialUserVote }: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote);

  async function handleVote(vote: 'up' | 'down') {
    if (userVote === vote) {
      // Toggle to the opposite vote instead of removing
      const oppositeVote = vote === 'up' ? 'down' : 'up';
      await voteArticle(articleId, oppositeVote);
      setUserVote(oppositeVote);
      if (vote === 'up') {
        setUpvotes(prev => prev - 1);
        setDownvotes(prev => prev + 1);
      } else {
        setUpvotes(prev => prev + 1);
        setDownvotes(prev => prev - 1);
      }
    } else {
      // Add/change vote
      await voteArticle(articleId, vote);
      if (userVote) {
        // Change vote
        if (vote === 'up') {
          setUpvotes(prev => prev + 1);
          setDownvotes(prev => prev - 1);
        } else {
          setUpvotes(prev => prev - 1);
          setDownvotes(prev => prev + 1);
        }
      } else {
        // Add new vote
        if (vote === 'up') {
          setUpvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
        }
      }
      setUserVote(vote);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant={userVote === 'up' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('up')}
      >
        <ThumbsUp className="w-4 h-4 mr-2" />
        {upvotes}
      </Button>
      <Button
        variant={userVote === 'down' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('down')}
      >
        <ThumbsDown className="w-4 h-4 mr-2" />
        {downvotes}
      </Button>
    </div>
  );
} 