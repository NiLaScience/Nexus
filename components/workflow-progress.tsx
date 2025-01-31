'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type WorkflowPhase = 'INITIAL' | 'GENERATING' | 'REFINING' | 'COMPLETE';

interface WorkflowProgressProps {
  currentPhase: WorkflowPhase;
  iterationCount: number;
  maxIterations: number;
  isComplete: boolean;
}

export function WorkflowProgress({ 
  currentPhase, 
  iterationCount, 
  maxIterations,
  isComplete 
}: WorkflowProgressProps) {
  const progress = ((iterationCount + 1) / maxIterations) * 100;
  
  const phases: WorkflowPhase[] = ['INITIAL', 'GENERATING', 'REFINING', 'COMPLETE'];
  const phaseLabels: Record<WorkflowPhase, string> = {
    'INITIAL': 'Starting',
    'GENERATING': 'Generating',
    'REFINING': 'Refining',
    'COMPLETE': 'Complete'
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Iteration {iterationCount + 1} of {maxIterations}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Phase indicators */}
      <div className="flex justify-between">
        {phases.map((phase, index) => (
          <div key={phase} className="flex flex-col items-center space-y-2">
            <Badge 
              variant={currentPhase === phase ? "default" : "outline"}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                index < phases.indexOf(currentPhase) && "bg-green-500",
                isComplete && "bg-green-500"
              )}
            >
              {index + 1}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {phaseLabels[phase]}
            </span>
          </div>
        ))}
      </div>

      {/* Status message */}
      <p className="text-sm text-muted-foreground text-center">
        {isComplete 
          ? "Process complete! Final candidates generated."
          : `Currently ${currentPhase.toLowerCase()} candidates...`
        }
      </p>
    </Card>
  );
} 