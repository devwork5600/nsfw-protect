"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function HomeTestModule() {
  return (
    <div className="grid lg:grid-cols-2 gap-16 items-start">
      <div className="space-y-8">
        <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tighter">
          Test our models in real-time with your own media.
        </h2>
        <p className="text-lg text-muted-foreground">
          Upload an image below to see our AI categorize and score the
          content instantly.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border p-4 bg-accent/30">
            <div className="text-sm font-heading tracking-widest text-muted-foreground uppercase mb-1">
              Latency
            </div>
            <div className="text-3xl font-mono text-primary">
              0.0<span className="text-sm text-primary/70">ms</span>
            </div>
          </div>
          <div className="border border-border p-4 bg-accent/30">
            <div className="text-sm font-heading tracking-widest text-muted-foreground uppercase mb-1">
              Edge Node
            </div>
            <div className="text-3xl font-mono text-primary">IAD-2</div>
          </div>
        </div>
      </div>

      <div className="relative group">
        <Card className={cn(
          "rounded-none border-border bg-card h-full min-h-100 flex flex-col items-center justify-center border-dashed border-2 transition-all cursor-pointer overflow-hidden hover:border-primary/50"
        )}>
          <div className="flex flex-col items-center p-12">
            <div className="w-20 h-20 mb-6 rounded-none bg-accent flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors group-hover:bg-primary/10">
              <Upload className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">
              Drop image here
            </h3>
            <p className="text-muted-foreground text-sm">
              Supports JPG, PNG, WEBP (Max 10MB)
            </p>
            <Button variant="outline" className="mt-8 rounded-none border-border group-hover:border-primary group-hover:text-primary transition-all">
              Select File
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
