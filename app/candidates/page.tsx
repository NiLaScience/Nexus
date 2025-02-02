// File: /Users/gauntlet/Documents/projects/nexus/app/candidates/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ParsedJobDescription } from '@/components/parsed-job-description';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowProgress } from '@/components/workflow-progress';
import { CriteriaRefinement } from '@/components/criteria-refinement';

interface WorkflowState {
  currentPhase: 'INITIAL' | 'GENERATING' | 'REFINING' | 'COMPLETE';
  iterationCount: number;
  isComplete: boolean;
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

interface Candidate {
  id: string;
  name: string;
  background: string;
  skills: string[];
  yearsOfExperience: number;
  achievements: string[];
  matchScore: number;
  reasonForMatch: string;
  scoringDetails?: {
    skillsScore: number;
    experienceScore: number;
    achievementsScore: number;
    culturalScore: number;
    leadershipScore?: number;
    scoreBreakdown: string;
  };
}

export default function CandidatesPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobText, setJobText] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [votedCandidates, setVotedCandidates] = useState<Set<string>>(new Set());
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentPhase: 'INITIAL',
    iterationCount: 0,
    isComplete: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [workflowType, setWorkflowType] = useState<'langgraph' | 'ai_sdk'>('ai_sdk');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when job ID changes
    if (jobId) {
      setVotedCandidates(new Set());
      setCandidates([]);
      setWorkflowState({
        currentPhase: 'INITIAL',
        iterationCount: 0,
        isComplete: false
      });
    }
  }, [jobId]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/candidates/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to parse file');

      setJobId(result.id);
      setJobText(result.text);
      toast.success("File parsed successfully");
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(error instanceof Error ? error.message : "Failed to parse file");
    } finally {
      setIsParsing(false);
    }
  };

  const handlePaste = async (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData('text');
    if (!text) return;

    event.preventDefault();
    setIsParsing(true);

    try {
      const response = await fetch('/api/candidates/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription: text }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to parse text');

      setJobId(result.id);
      setJobText(result.text);
      toast.success("Text parsed successfully");
    } catch (error) {
      console.error('Error parsing text:', error);
      toast.error(error instanceof Error ? error.message : "Failed to parse text");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/candidates/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to parse file');

      setJobId(result.id);
      setJobText(result.text);
      toast.success("File parsed successfully");
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(error instanceof Error ? error.message : "Failed to parse file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (!jobId) {
      toast.error("No job description ID found");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await fetch('/api/candidate-matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          jobDescriptionId: jobId,
          workflowType,
          feedback: [...votedCandidates].map(candidateId => ({
            candidateId,
            isPositive: true,
            reason: 'Manual selection'
          }))
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate candidates');
      console.log('Generated candidates:', result);
      if (result.data) {
        setCandidates(result.data.finalCandidates);
        setWorkflowState({
          currentPhase: result.data.needsFeedback ? 'GENERATING' : 'COMPLETE',
          iterationCount: result.data.iterationCount,
          isComplete: result.data.isComplete,
          refinedCriteria: result.data.refinedCriteria
        });
      }
      toast.success("Candidates generated successfully");
    } catch (error) {
      console.error('Error generating candidates:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate candidates");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVote = (candidateId: string) => {
    const newVotes = new Set(votedCandidates);
    if (newVotes.has(candidateId)) {
      newVotes.delete(candidateId);
    } else {
      newVotes.add(candidateId);
    }
    setVotedCandidates(newVotes);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Job Description</h1>
          <div className="flex items-center space-x-4">
            <Select
              value={workflowType}
              onValueChange={(value: 'langgraph' | 'ai_sdk') => setWorkflowType(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select workflow type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="langgraph">LangGraph</SelectItem>
                <SelectItem value="ai_sdk">AI SDK</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isParsing}
            >
              {isParsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            <Button
              onClick={handleGenerate}
              disabled={!jobId || isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        <Card
          className={cn(
            "p-4 border-2 border-dashed rounded-lg min-h-[200px] relative",
            "hover:border-blue-500 transition-colors duration-200",
            isParsing && "opacity-50"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
        >
          {jobText ? (
            <ParsedJobDescription text={jobText} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              {isParsing ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </div>
              ) : (
                <p>
                  Drop a file here, paste text, or click Upload to add a job description
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {workflowState.currentPhase !== 'INITIAL' && (
        <WorkflowProgress
          currentPhase={workflowState.currentPhase}
          iterationCount={workflowState.iterationCount}
          isComplete={workflowState.isComplete}
          maxIterations={5}
        />
      )}

      {workflowState.refinedCriteria && (
        <CriteriaRefinement refinedCriteria={workflowState.refinedCriteria} />
      )}

      {candidates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Generated Candidates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{candidate.name}</h3>
                    <p className="text-sm text-gray-500">
                      {candidate.yearsOfExperience} years of experience
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(candidate.id)}
                      className={cn(
                        votedCandidates.has(candidate.id)
                          ? "text-green-600"
                          : "text-gray-400"
                      )}
                    >
                      {votedCandidates.has(candidate.id) ? (
                        <HandThumbUpIcon className="h-5 w-5" />
                      ) : (
                        <HandThumbDownIcon className="h-5 w-5" />
                      )}
                    </Button>
                    <span className="text-sm font-medium">
                      {candidate.matchScore}% match
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm">{candidate.background}</p>
                  
                  <div>
                    <h4 className="text-sm font-medium">Skills</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {candidate.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium">Achievements</h4>
                    <ul className="list-disc list-inside text-sm">
                      {candidate.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>

                  {candidate.scoringDetails && (
                    <div>
                      <h4 className="text-sm font-medium">Score Breakdown</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Skills: {candidate.scoringDetails.skillsScore}%</div>
                        <div>
                          Experience: {candidate.scoringDetails.experienceScore}%
                        </div>
                        <div>
                          Achievements: {candidate.scoringDetails.achievementsScore}%
                        </div>
                        <div>
                          Cultural Fit: {candidate.scoringDetails.culturalScore}%
                        </div>
                        {candidate.scoringDetails.leadershipScore && (
                          <div>
                            Leadership: {candidate.scoringDetails.leadershipScore}%
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {candidate.scoringDetails.scoreBreakdown}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
