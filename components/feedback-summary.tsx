'use client';

import { Card } from '@/components/ui/card';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';

interface FeedbackSummaryProps {
  feedback: Array<{
    candidateId: string;
    isPositive: boolean;
    reason?: string;
  }>;
}

export function FeedbackSummary({ feedback }: FeedbackSummaryProps) {
  const positiveCount = feedback.filter(f => f.isPositive).length;
  const negativeCount = feedback.length - positiveCount;
  const positiveRatio = feedback.length > 0 ? (positiveCount / feedback.length) * 100 : 0;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Feedback Summary</h3>
      
      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{feedback.length}</div>
          <div className="text-sm text-muted-foreground">Total Feedback</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
            <HandThumbUpIcon className="h-6 w-6 mr-1" />
            {positiveCount}
          </div>
          <div className="text-sm text-muted-foreground">Positive</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
            <HandThumbDownIcon className="h-6 w-6 mr-1" />
            {negativeCount}
          </div>
          <div className="text-sm text-muted-foreground">Negative</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-green-600 h-2.5 rounded-full"
          style={{ width: `${positiveRatio}%` }}
        />
      </div>

      {/* Recent feedback */}
      {feedback.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Feedback</h4>
          <div className="space-y-2">
            {feedback.slice(-3).reverse().map((f, i) => (
              <div key={i} className="flex items-start space-x-2 text-sm">
                {f.isPositive ? (
                  <HandThumbUpIcon className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <HandThumbDownIcon className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <span className="text-muted-foreground">
                  {f.reason || (f.isPositive ? 'Good fit' : 'Not a good fit')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          No feedback provided yet
        </p>
      )}
    </Card>
  );
} 