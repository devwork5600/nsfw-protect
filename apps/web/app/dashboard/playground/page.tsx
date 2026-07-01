'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, ImageIcon, Loader2, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '');

if (typeof window !== 'undefined' && !API_URL && window.location.hostname !== 'localhost') {
  console.warn('[NSFW] NEXT_PUBLIC_API_URL is not set. API calls will likely fail.');
}

interface ClassificationResult {
  label: string;
  confidence: number;
}

interface JobResponse {
  jobId: string;
}

interface ResultResponse {
  status: 'pending' | 'done' | 'error';
  result?: ClassificationResult[];
  error?: string;
}

export default function PlaygroundPage() {
  const [apiKey, setApiKey] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult[] | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [, setPolling] = useState(false);

  // Load API key from local storage if available (Removed for security)
  useEffect(() => {
    // We no longer persist API keys to localStorage for better security
  }, []);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    // localStorage.setItem('nsfw_playground_key', newKey); (Security: Don't store keys in localStorage)
  };

  const pollResult = useCallback(async (jobId: string) => {
    setPolling(true);
    let attempts = 0;
    const MAX_ATTEMPTS = 30;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        setIsClassifying(false);
        setPolling(false);
        toast.error('Analysis timed out.');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/result/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch result');

        const data: ResultResponse = await res.json();

        if (data.status === 'done' && data.result) {
          setResult(data.result);
          setIsClassifying(false);
          setPolling(false);
          clearInterval(interval);
          toast.success('Classification complete!');
        } else if (data.status === 'error') {
          throw new Error(data.error || 'Processing failed');
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'An error occurred');
        setIsClassifying(false);
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!apiKey) {
        toast.error('Please enter your API key first');
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setResult(null);
      setIsClassifying(true);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch(`${API_URL}/classify`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to classify image');
        }

        const { jobId }: JobResponse = await response.json();
        pollResult(jobId);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'An error occurred');
        setIsClassifying(false);
      }
    },
    [apiKey, pollResult],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const clearImage = () => {
    setPreview(null);
    setResult(null);
  };

  const nsfwLabels = ['porn', 'hentai', 'sexy', 'nsfw'];

  const nsfwScore =
    result?.reduce((acc, r) => {
      if (nsfwLabels.includes(r.label.trim().toLowerCase())) {
        return acc + r.confidence;
      }
      return acc;
    }, 0) || 0;

  const isNSFW = nsfwScore > 0.5;

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight uppercase">Playground</h2>
        <p className="text-muted-foreground">Test our NSFW detection API with your own images.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Enter your API key to authenticate requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk_..."
              value={apiKey}
              onChange={handleKeyChange}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Your API key is saved locally in your browser.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card
          className={cn(
            'relative overflow-hidden flex flex-col',
            isDragActive && 'border-primary ring-2 ring-primary/20',
          )}
        >
          <div
            {...getRootProps()}
            className={cn(
              'flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted-foreground/25 rounded-lg m-4 cursor-pointer hover:bg-accent/50 transition-colors',
              preview && 'p-4 border-none',
            )}
          >
            <input {...getInputProps()} />

            {preview ? (
              <div className="relative w-full aspect-square rounded-md overflow-hidden bg-accent flex items-center justify-center">
                <Image
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                />
                {isClassifying && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="font-heading font-bold uppercase tracking-widest text-sm">
                      Analyzing..
                    </p>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full size-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearImage();
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Upload className="size-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-heading font-bold uppercase tracking-wide">
                    {isDragActive ? 'Drop it here!' : 'Drag & Drop Image'}
                  </p>
                  <p className="text-sm text-muted-foreground">Support JPEG, PNG, WEBP (Max 5MB)</p>
                </div>
                <Button variant="outline" type="button">
                  Select File
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Classification breakdown from the AI model.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {!result && !isClassifying && (
              <div className="text-center py-12 text-muted-foreground space-y-3">
                <ImageIcon className="size-12 mx-auto opacity-20" />
                <p>Upload an image to see results</p>
              </div>
            )}

            {isClassifying && (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-accent animate-pulse rounded" />
                      <div className="h-4 w-12 bg-accent animate-pulse rounded" />
                    </div>
                    <div className="h-2 w-full bg-accent animate-pulse rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {result && (
              <div className="space-y-8">
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  {isNSFW ? (
                    <>
                      <div className="size-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive border-4 border-destructive/20 animate-in zoom-in">
                        <ShieldAlert className="size-10" />
                      </div>
                      <div className="space-y-1">
                        <Badge
                          variant="destructive"
                          className="uppercase font-bold tracking-widest px-4 py-1"
                        >
                          NSFW DETECTED
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          This image contains explicit content.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="size-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 border-4 border-green-500/20 animate-in zoom-in">
                        <ShieldCheck className="size-10" />
                      </div>
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200 bg-green-50 uppercase font-bold tracking-widest px-4 py-1"
                        >
                          SFW / SAFE
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                          No explicit content detected.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                    Confidence Scores
                  </h4>
                  {result.map((r) => (
                    <div key={r.label} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{r.label}</span>
                        <span className="text-muted-foreground">
                          {(r.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-accent rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-1000',
                            ['porn', 'hentai', 'sexy'].includes(r.label.toLowerCase()) &&
                              r.confidence > 0.5
                              ? 'bg-destructive'
                              : 'bg-primary',
                          )}
                          style={{ width: `${r.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
