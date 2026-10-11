import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyTokenButtonProps {
  token: string;
  className?: string;
  variant?: 'badge' | 'button' | 'inline';
}

export const CopyTokenButton: React.FC<CopyTokenButtonProps> = ({
  token,
  className = '',
  variant = 'button',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const cleanToken = token.trim().toUpperCase();

    // Try modern Clipboard API
    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(cleanToken);
        success = true;
      } catch {
        // Fallback below
      }
    }

    // Fallback using hidden textarea
    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = cleanToken;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // ignore
      }
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border/80 font-mono text-xs ${className}`}>
        <span className="font-bold text-foreground tracking-wider select-all">{token.toUpperCase()}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy reference token ${token.toUpperCase()}`}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          title={copied ? 'Copied!' : 'Copy reference token'}
        >
          {copied ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </span>
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy reference token ${token.toUpperCase()}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
        copied
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-surface-2 hover:bg-surface-3 border-border/70 text-muted-foreground hover:text-foreground'
      } ${className}`}
      title={copied ? 'Copied to clipboard' : 'Copy reference token'}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-sans">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span className="text-[11px] font-sans">Copy</span>
        </>
      )}
    </button>
  );
};
