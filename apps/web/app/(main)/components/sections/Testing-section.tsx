'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/score-bar';
import { testImageAction } from '@/actions/test-service';

interface ClassificationResult {
  label: string;
  score: number;
}

export function TestingSection() {
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult[] | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Revoke the previous blob URL whenever preview changes (fixes memory leak)
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Client-side size check (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image is too large. Max size is 20MB.');
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setResult(null);
    setIsClassifying(true);
    startTimeRef.current = Date.now();
    setLatency(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // The API responds with the classification directly — no polling needed.
      const data = await testImageAction(formData);

      if (data.error) throw new Error(data.error);
      if (data.status !== 'done' || !data.result) {
        throw new Error('Analysis timed out. Please try again.');
      }

      setResult(data.result);
      setLatency(Date.now() - startTimeRef.current);
      toast.success('Analysis complete!');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const clearImage = () => {
    setIsClassifying(false);
    setPreview(null);
    setResult(null);
    setLatency(null);
  };

  // The model is binary: it returns exactly 'nsfw' and 'sfw' labels.
  const nsfwScore = result?.find((r) => r.label.trim().toLowerCase() === 'nsfw')?.score ?? 0;
  const isNSFW = nsfwScore > 0.5;
  // Only show the score for the predicted class, not both nsfw and sfw.
  const topResult = result?.find((r) => r.label.trim().toLowerCase() === (isNSFW ? 'nsfw' : 'sfw'));

  return (
    <section className="container mx-auto max-w-360 px-4 py-32">
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tighter">
            Test our models in real-time with your own media.
          </h2>
          <p className="text-lg text-muted-foreground">
            Upload an image below to see our AI categorize and score the content instantly.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative z-10 border border-border p-4 bg-card">
              <div className="text-sm font-heading tracking-widest text-muted-foreground uppercase mb-1">
                Latency
              </div>
              <div className="text-3xl font-mono text-primary">
                {latency !== null ? latency.toFixed(0) : '—'}
                <span className="text-sm text-primary/70">ms</span>
              </div>
            </div>
            <div className="relative z-10 border border-border p-4 bg-card">
              <div className="text-sm font-heading tracking-widest text-muted-foreground uppercase mb-1">
                Edge Node
              </div>
              <div className="text-3xl font-mono text-primary">IAD-2</div>
            </div>
          </div>

          {result && (
            <div className="p-6 border border-border bg-card space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold uppercase tracking-widest text-sm">
                  Results
                </h4>
                {isNSFW ? (
                  <Badge variant="destructive" className="uppercase font-bold tracking-widest">
                    NSFW DETECTED
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200 bg-green-50 uppercase font-bold tracking-widest"
                  >
                    SFW / SAFE
                  </Badge>
                )}
              </div>

              {topResult && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs uppercase font-bold tracking-tighter">
                      <span>{topResult.label}</span>
                      <span>{(topResult.score * 100).toFixed(1)}%</span>
                    </div>
                    <ScoreBar label={topResult.label} score={topResult.score} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div {...getRootProps()} className="relative z-10 group">
          <input {...getInputProps()} />
          <Card
            className={cn(
              'rounded-none border-border bg-card h-100 flex flex-col items-center justify-center border-dashed border-2 transition-all cursor-pointer overflow-hidden',
              isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50',
              preview ? 'border-solid' : '',
            )}
          >
            {preview ? (
              <div className="relative w-full h-full">
                <div className="absolute inset-4">
                  <Image src={preview} alt="Preview" fill unoptimized className="object-contain" />
                </div>
                {isClassifying && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="font-heading font-bold uppercase tracking-widest text-sm">
                      Analyzing...
                    </p>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 rounded-none size-10 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearImage();
                  }}
                >
                  <X className="size-5" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center p-12">
                <div className="w-20 h-20 mb-6 rounded-none bg-accent flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors group-hover:bg-primary/10">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                  {isDragActive ? 'Drop image now' : 'Drop image here'}
                </h3>
                <p className="text-muted-foreground text-sm">Supports JPG, PNG, WEBP (Max 20MB)</p>
                <Button
                  variant="outline"
                  className="mt-8 rounded-none border-border group-hover:border-primary group-hover:text-primary transition-all"
                >
                  Select File
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
