'use client';

import { useState, useEffect, useRef } from 'react';
import { ParsedJobDescription } from '@/components/parsed-job-description';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CandidatesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for results if we have a jobId
  useEffect(() => {
    if (!jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/candidates/parse/${jobId}`);
        const data = await response.json();

        if (response.ok) {
          setRawText(data.text);
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
    setRawText(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/candidates/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setRawText(data.text);
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

      {rawText && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Raw Text</h2>
              {jobId && !parsedData && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing with AI...
                </div>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">{rawText}</pre>
          </div>
        </Card>
      )}

      {parsedData && (
        <ParsedJobDescription parsedData={parsedData} />
      )}
    </div>
  );
} 
