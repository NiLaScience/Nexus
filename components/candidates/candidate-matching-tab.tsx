"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileUp, Upload, Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CandidateMatchingTab() {
  const [jobDescription, setJobDescription] = React.useState<string>("");
  const [jobDescriptionId, setJobDescriptionId] = React.useState<string>("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isParsing, setIsParsing] = React.useState(false);
  const [candidates, setCandidates] = React.useState<any[]>([]);
  const [url, setUrl] = React.useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = React.useState<Record<string, boolean>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Poll for parsing status
  const pollParseStatus = React.useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/parse/${id}`);
      const data = await response.json();

      if (response.ok) {
        if (data.status === 'completed' && data.parsed) {
          // Stop polling once parsing is complete
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setIsParsing(false);
          setJobDescription(data.parsed_content);
          toast.success("Job description parsed successfully");
          return true;
        } else if (data.status === 'error') {
          throw new Error('Failed to parse job description');
        }
      }
      return false;
    } catch (error) {
      console.error('Error polling parse status:', error);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsParsing(false);
      toast.error(error instanceof Error ? error.message : "Failed to check parse status");
      return false;
    }
  }, []);

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsParsing(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/candidates/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to upload job description');

      setJobDescriptionId(result.id);
      
      // Start polling for parse status
      pollIntervalRef.current = setInterval(() => pollParseStatus(result.id), 2000) as NodeJS.Timeout;

      toast.success("Job description uploaded successfully");
    } catch (error) {
      console.error('Error uploading job description:', error);
      setIsParsing(false);
      toast.error(error instanceof Error ? error.message : "Failed to upload job description");
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

      setJobDescriptionId(result.id);
      
      // Start polling for parse status
      pollIntervalRef.current = setInterval(() => pollParseStatus(result.id), 2000) as NodeJS.Timeout;

      toast.success("Job description loaded successfully");
    } catch (error) {
      console.error('Error loading job description:', error);
      setIsParsing(false);
      toast.error(error instanceof Error ? error.message : "Failed to load job description");
    }
  };

  const handleGenerate = async () => {
    if (!jobDescriptionId) {
      toast.error("Please wait for job description parsing to complete");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/candidates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescriptionId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate candidates');
      }

      setCandidates(result.candidates || []);
      toast.success("Candidates generated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate candidates");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFeedback = async (candidateId: string, isGoodFit: boolean) => {
    try {
      const response = await fetch('/api/candidates/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidateId, isGoodFit }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setFeedbackSubmitted(prev => ({ ...prev, [candidateId]: true }));
      toast.success("Feedback submitted successfully");
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-6">Candidate Matching</h2>
        
        <div className="space-y-4 max-w-md">
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="url">Enter URL</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              <div className="space-y-2">
                <Label>Job Description File</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="*/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    {isParsing ? "Parsing..." : "Upload Job Description"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="url">
              <div className="space-y-2">
                <Label>Job Description URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isParsing}
                  />
                  <Button 
                    variant="outline"
                    onClick={handleUrlSubmit}
                    disabled={isParsing || !url.trim()}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    {isParsing ? "Parsing..." : "Parse"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {jobDescription && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-sm">
                {jobDescription.slice(0, 200)}
                {jobDescription.length > 200 ? "..." : ""}
              </pre>
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !jobDescription}
            className="w-full"
          >
            {isGenerating ? (
              "Generating Candidates..."
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Generate Candidates
              </>
            )}
          </Button>

          {candidates.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Generated Candidates</h3>
              {candidates.slice(0, 3).map((candidate, index) => (
                <div key={index} className="p-4 bg-muted rounded-md">
                  <h4 className="font-medium">{candidate.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {candidate.background}
                  </p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Skills: </span>
                    {candidate.skills.join(", ")}
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Experience: </span>
                    {candidate.yearsOfExperience} years
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Match Score: </span>
                    {candidate.matchScore}%
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Reason for Match: </span>
                    {candidate.reasonForMatch}
                  </div>
                  {!feedbackSubmitted[candidate.id] ? (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        className="w-1/2"
                        onClick={() => handleFeedback(candidate.id, true)}
                      >
                        👍 Good Fit
                      </Button>
                      <Button
                        variant="outline"
                        className="w-1/2"
                        onClick={() => handleFeedback(candidate.id, false)}
                      >
                        👎 Not a Fit
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-muted-foreground">
                      ✅ Feedback submitted
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
