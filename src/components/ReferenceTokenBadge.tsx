import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceTokenBadgeProps {
  token: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ReferenceTokenBadge: React.FC<ReferenceTokenBadgeProps> = ({
  token,
  className,
  showLabel = true,
  size = 'md',
}) => {
  const [copied, setCopied] = useState(false);
  const uppercaseToken = (token || '').toUpperCase();

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(uppercaseToken);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success) {
      // Fallback using hidden textarea and execCommand
      try {
        const textArea = document.createElement('textarea');
        textArea.value = uppercaseToken;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [uppercaseToken]);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3 py-1 gap-2',
    lg: 'text-sm sm:text-base px-4 py-1.5 gap-2.5',
  }[size];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl bg-surface-2 border border-border/80 font-mono select-all transition-colors',
        sizeClasses,
        className
      )}
    >
      {showLabel && (
        <span className="text-[10px] sm:text-xs uppercase text-muted-foreground font-sans font-semibold tracking-wider">
          Ref:
        </span>
      )}
      <span className="font-bold tracking-wider text-accent font-mono">
        {uppercaseToken}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded-md hover:bg-surface-3 text-muted-foreground hover:text-foreground transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ml-0.5"
        title="Copy reference token to clipboard"
        aria-label={`Copy reference token ${uppercaseToken}`}
      >
        {copied ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-emerald-500">
            <Check className="w-3.5 h-3.5" />
            <span>Copied</span>
          </span>
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
