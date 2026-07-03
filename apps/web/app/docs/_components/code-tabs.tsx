'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

type CodeTab = {
  label: string;
  code: string;
};

function highlightLine(line: string) {
  const parts = line.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g);
  return parts.map((part, i) =>
    part.startsWith('"') || part.startsWith("'") ? (
      <span key={i} className="text-green-400">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tabs[active].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-none border-border border bg-[#111112] overflow-hidden">
      <div className="h-10 bg-muted/30 border-b border-border flex items-center px-2 justify-between">
        <div className="flex items-center gap-1">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'px-2.5 py-1 text-xs font-heading uppercase tracking-widest font-bold transition-colors',
                i === active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="text-muted-foreground hover:text-primary transition-colors p-2"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="p-4 font-mono text-sm text-muted-foreground overflow-x-auto leading-relaxed">
        <code className="block whitespace-pre">
          {tabs[active].code.split('\n').map((line, i) => (
            <span key={i} className="block">
              {highlightLine(line)}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
