'use client';

import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { voteArticle } from '@/app/actions/articles/articles.server';
import { useTransition } from 'react';

interface VoteButtonsProps {
  articleId: string;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
}

export function VoteButtons({ articleId, upvotes, downvotes, userVote }: VoteButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleVote = (voteType: 'up' | 'down') => {
    startTransition(async () => {
      await voteArticle(articleId, voteType);
    });
  };

  return (
    <div className="flex justify-center gap-4">
      <Button
        variant={userVote === 'up' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('up')}
        disabled={isPending}
      >
        <ThumbsUp className="w-4 h-4 mr-2" />
        Helpful ({upvotes})
      </Button>
      <Button
        variant={userVote === 'down' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('down')}
        disabled={isPending}
      >
        <ThumbsDown className="w-4 h-4 mr-2" />
        Not Helpful ({downvotes})
      </Button>
    </div>
  );
} 