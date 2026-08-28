import { cn } from '@/lib/utils';

interface ScoreBarProps {
  label: string;
  score: number;
  className?: string;
}

// The model is binary: it returns exactly 'nsfw' and 'sfw' labels.
export function ScoreBar({ label, score, className }: ScoreBarProps) {
  return (
    <div className={cn('h-1.5 w-full bg-accent overflow-hidden', className)}>
      <div
        className={cn(
          'h-full transition-[width] duration-1000',
          label.toLowerCase() === 'nsfw' && score > 0.5 ? 'bg-red-600' : 'bg-green-600',
        )}
        style={{ width: `${score * 100}%` }}
      />
    </div>
  );
}
