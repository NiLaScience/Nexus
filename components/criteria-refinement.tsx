'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface CriteriaRefinementProps {
  refinedCriteria?: {
    requiredSkills: Array<{
      skill: string;
      importance: number;
      reason: string;
    }>;
    preferredSkills: Array<{
      skill: string;
      importance: number;
      reason: string;
    }>;
    experienceLevel: {
      minYears: number;
      maxYears: number;
      reason: string;
    };
    culturalAttributes: Array<{
      attribute: string;
      importance: number;
      reason: string;
    }>;
    adjustments: Array<{
      aspect: string;
      change: "increased" | "decreased" | "unchanged";
      reason: string;
    }>;
  };
}

export function CriteriaRefinement({ refinedCriteria }: CriteriaRefinementProps) {
  if (!refinedCriteria) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          No criteria refinements yet
        </p>
      </Card>
    );
  }

  const getChangeIcon = (change: "increased" | "decreased" | "unchanged") => {
    switch (change) {
      case "increased":
        return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
      case "decreased":
        return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="p-4 space-y-6">
      <h3 className="text-lg font-semibold">Criteria Refinements</h3>

      {/* Required Skills */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Required Skills</h4>
        <div className="flex flex-wrap gap-2">
          {refinedCriteria.requiredSkills.map((skill, i) => (
            <Badge
              key={i}
              variant="outline"
              className="flex items-center gap-1"
              title={skill.reason}
            >
              {skill.skill}
              <span className="text-xs text-muted-foreground">
                ({skill.importance})
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Preferred Skills */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Preferred Skills</h4>
        <div className="flex flex-wrap gap-2">
          {refinedCriteria.preferredSkills.map((skill, i) => (
            <Badge
              key={i}
              variant="outline"
              className="flex items-center gap-1"
              title={skill.reason}
            >
              {skill.skill}
              <span className="text-xs text-muted-foreground">
                ({skill.importance})
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Experience Level</h4>
        <p className="text-sm text-muted-foreground">
          {refinedCriteria.experienceLevel.minYears}-{refinedCriteria.experienceLevel.maxYears} years
          <span className="text-xs ml-2">({refinedCriteria.experienceLevel.reason})</span>
        </p>
      </div>

      {/* Cultural Attributes */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Cultural Attributes</h4>
        <div className="flex flex-wrap gap-2">
          {refinedCriteria.culturalAttributes.map((attr, i) => (
            <Badge
              key={i}
              variant="outline"
              className="flex items-center gap-1"
              title={attr.reason}
            >
              {attr.attribute}
              <span className="text-xs text-muted-foreground">
                ({attr.importance})
              </span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Adjustments */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Recent Adjustments</h4>
        <div className="space-y-2">
          {refinedCriteria.adjustments.map((adj, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {getChangeIcon(adj.change)}
              <span className="font-medium">{adj.aspect}:</span>
              <span className="text-muted-foreground">{adj.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 