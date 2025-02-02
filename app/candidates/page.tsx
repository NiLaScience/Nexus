// File: /Users/gauntlet/Documents/projects/nexus/app/candidates/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ParsedJobDescription } from '@/components/parsed-job-description';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Link } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkflowProgress } from '@/components/workflow-progress';
import { FeedbackSummary } from '@/components/feedback-summary';
import { CriteriaRefinement } from '@/components/criteria-refinement';
import type { CandidateFeedback } from '@/lib/ai-sdk/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CandidatesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [votedCandidates, setVotedCandidates] = useState<Set<string>>(new Set());
  const [workflowState, setWorkflowState] = useState<{
    currentPhase: 'INITIAL' | 'GENERATING' | 'REFINING' | 'COMPLETE';
    iterationCount: number;
    isComplete: boolean;
    refinedCriteria?: any;
  }>({
    currentPhase: 'INITIAL',
    iterationCount: 0,
    isComplete: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [workflowType, setWorkflowType] = useState<'langgraph' | 'ai_sdk'>('langgraph');
  const [feedbackHistory, setFeedbackHistory] = useState<CandidateFeedback[]>([]);

  // Poll for parsing results if jobId is set.
  useEffect(() => {
    if (!jobId) return;
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/candidates/parse/${jobId}`);
        const data = await response.json();
        if (response.ok) {
          if (data.parsed) {
            setParsedData(data.parsed);
            clearInterval(pollInterval);
          }
        } else {
          console.error('Error polling for results:', data.error);
        }
      } catch (error) {
        console.error('Error polling for results:', error);
      }
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [jobId]);

  // Poll for parsing status.
  const pollParseStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/parse/${id}`);
      const data = await response.json();
      if (response.ok) {
        if (data.status === 'completed' && data.parsed) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsParsing(false);
          toast.success("Job description parsed successfully");
          return true;
        } else if (data.status === 'error') {
          throw new Error('Failed to parse job description');
        }
      }
      return false;
    } catch (error) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsParsing(false);
      toast.error(error instanceof Error ? error.message : "Failed to check parse status");
      return false;
    }
  };

  // Cleanup polling on unmount.
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    setLoading(true);
    setError(null);
    setParsedData(null);
    try {
      setIsParsing(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/candidates/parse', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setJobId(data.id);
        pollIntervalRef.current = setInterval(() => pollParseStatus(data.id), 2000);
      } else {
        setError(data.error || 'Failed to parse job description');
      }
    } catch (error) {
      setError('An error occurred while uploading the file');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a PDF file');
    }
  };

  const handleUrlSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url) return;
    try {
      setIsParsing(true);
      const response = await fetch('/api/candidates/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load job description');
      setJobId(result.id);
      pollIntervalRef.current = setInterval(() => pollParseStatus(result.id), 2000);
      toast.success("Job description loaded successfully");
    } catch (error) {
      setIsParsing(false);
      toast.error(error instanceof Error ? error.message : "Failed to load job description");
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
            isPositive: true, // This will be replaced by actual vote value.
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

  const handleVote = async (candidateId: string, isGoodFit: boolean) => {
    if (!candidateId || !jobId) {
      toast.error('Invalid candidate ID or job ID');
      return;
    }
    try {
      console.log('Submitting vote:', { candidateId, isGoodFit, jobId, workflowType });
      const response = await fetch('/api/candidates/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          jobDescriptionId: jobId,
          isGoodFit
        }),
      });
      const result = await response.json();
      console.log('Feedback response:', result);
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit feedback');
      }
      // Update local feedback history.
      setFeedbackHistory(prev => [...prev, {
        candidateId,
        isPositive: isGoodFit,
        reason: 'Manual selection'
      }]);
      // Mark candidate as voted.
      setVotedCandidates(prev => new Set([...prev, candidateId]));
      toast.success("Feedback submitted successfully");
      // Check if all candidates have been voted on.
      const allVoted = candidates.every(c => {
        const hasVoted = votedCandidates.has(c.id) || c.id === candidateId;
        console.log(`Candidate ${c.id}: voted=${hasVoted}`);
        return hasVoted;
      });
      console.log('All candidates voted:', allVoted);
      if (allVoted && jobId) {
        if (workflowState.isComplete) {
          toast.info("Maximum iterations reached or no more feedback needed. Thank you for your feedback!");
          return;
        }
        toast.info("Generating new candidates based on feedback...");
        await handleGenerate();
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card className="p-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Parse Job Description</h1>
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              "hover:border-primary/50 hover:bg-muted/50",
              error ? "border-destructive" : "border-muted-foreground/25"
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              {file ? (
                <p className="text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="text-lg font-medium">Drop your PDF here or click to browse</p>
                  <p className="text-sm text-muted-foreground">PDF files only, up to 10MB</p>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleUpload}
              disabled={!file || loading || isParsing}
              className="min-w-[120px]"
            >
              {(loading || isParsing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Uploading...' : isParsing ? 'Parsing...' : 'Upload & Parse'}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isParsing && !error && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing job description...
            </div>
          )}
        </div>
      </Card>
      {parsedData && (
        <div className="space-y-4">
          <ParsedJobDescription parsedData={parsedData} />
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Select
                value={workflowType}
                onValueChange={(value: 'langgraph' | 'ai_sdk') => setWorkflowType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="langgraph">LangGraph</SelectItem>
                  <SelectItem value="ai_sdk">AI SDK</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Candidates...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Candidates
                  </>
                )}
              </Button>
            </div>
          </Card>
          {/* Workflow Progress */}
          {workflowState.iterationCount > 0 && (
            <WorkflowProgress
              currentPhase={workflowState.currentPhase}
              iterationCount={workflowState.iterationCount}
              maxIterations={5}
              isComplete={workflowState.isComplete}
            />
          )}
          {/* Display refined criteria via the CriteriaRefinement component */}
          <CriteriaRefinement refinedCriteria={workflowState.refinedCriteria} />
          {/* Candidates Grid */}
          {candidates.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Generated Candidates</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {candidates.map((candidate, index) => (
                  <div key={candidate.id || `candidate-${index}`} className="bg-card border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground">{candidate.background}</p>
                      </div>
                      {!votedCandidates.has(candidate.id) && (
                        <div className="flex space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleVote(candidate.id, true)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <HandThumbUpIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleVote(candidate.id, false)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <HandThumbDownIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-1">Skills</h4>
                        <ul className="list-disc list-inside text-muted-foreground">
                          {candidate.skills.map((skill: string, index: number) => (
                            <li key={`${candidate.id}-skill-${index}`}>{skill}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p><span className="font-medium">Experience:</span> {candidate.yearsOfExperience} years</p>
                        <p><span className="font-medium">Match Score:</span> {candidate.matchScore}%</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <h4 className="font-medium mb-1">Achievements</h4>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {candidate.achievements.map((achievement: string, index: number) => (
                          <li key={`${candidate.id}-achievement-${index}`}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Match Reasoning:</span> {candidate.reasonForMatch}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
