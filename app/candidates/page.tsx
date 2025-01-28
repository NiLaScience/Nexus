'use client';

import { useState, useEffect, useRef } from 'react';
import { ParsedJobDescription } from '@/components/parsed-job-description';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CandidatesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for results if we have a jobId
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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/candidates/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setJobId(data.id);
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
        body: JSON.stringify({ jobDescriptionId: jobId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate candidates');

      console.log('Generated candidates:', result);
      if (result.data?.finalCandidates) {
        setCandidates(result.data.finalCandidates);
      }
      toast.success("Candidates generated successfully");
    } catch (error) {
      console.error('Error generating candidates:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate candidates");
    } finally {
      setIsGenerating(false);
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
              disabled={!file || loading}
              className="min-w-[120px]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Uploading...' : 'Upload & Parse'}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </Card>

      {parsedData && (
        <div className="space-y-4">
          <ParsedJobDescription parsedData={parsedData} />
          
          <Card className="p-6">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
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
          </Card>

          {candidates.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Generated Candidates</h2>
              {candidates.map((candidate, index) => (
                <Card key={index} className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                        <p className="text-muted-foreground">{candidate.background}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{candidate.matchScore}%</div>
                        <div className="text-sm text-muted-foreground">Match Score</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill: string, skillIndex: number) => (
                          <span
                            key={skillIndex}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Experience & Achievements</h4>
                      <p className="mb-2">Years of Experience: {candidate.yearsOfExperience}</p>
                      <ul className="list-disc list-inside space-y-1">
                        {candidate.achievements.map((achievement: string, achievementIndex: number) => (
                          <li key={achievementIndex} className="text-muted-foreground">
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Match Reasoning</h4>
                      <p className="text-muted-foreground">{candidate.reasonForMatch}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
