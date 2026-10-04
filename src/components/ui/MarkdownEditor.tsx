import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3,
  List, 
  ListOrdered, 
  Code, 
  Quote, 
  Link as LinkIcon, 
  Eye, 
  Edit3,
  Table as TableIcon,
  Minus,
  Strikethrough,
  FileCode
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { FormLabel, FormDescription, FormMessage } from '@/components/forms/FormControls';

// Configure marked options
marked.use({
  gfm: true,
  breaks: true,
  async: false,
});

/**
 * Safely parses markdown text into sanitized HTML
 */
export const renderMarkdownHtml = (md: string): string => {
  if (!md || typeof md !== 'string' || !md.trim()) return '';
  try {
    const rawParsed = marked.parse(md, { async: false }) as string;

    // Check if DOMPurify is available in browser
    if (typeof window !== 'undefined') {
      try {
        const purifyInstance = 
          typeof DOMPurify?.sanitize === 'function'
            ? DOMPurify
            : typeof DOMPurify === 'function'
              ? DOMPurify(window)
              : null;

        if (purifyInstance && typeof purifyInstance.sanitize === 'function') {
          return purifyInstance.sanitize(rawParsed, {
            ADD_ATTR: ['target', 'rel', 'class', 'align'],
          });
        }
      } catch (purifyErr) {
        console.warn('DOMPurify sanitize failed, using fallback sanitizer:', purifyErr);
      }
    }

    // Node / SSR / Test fallback sanitization
    return rawParsed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/\son\w+=[^\s>]+/gi, '')
      .replace(/javascript:[^"']*/gi, '');
  } catch (err) {
    console.error('Markdown parse error:', err);
    return md;
  }
};

/**
 * Universal Markdown renderer component used in Preview tabs, Detail pages, and documentation views
 */
export const MarkdownContent: React.FC<{ content: string; className?: string }> = ({ content, className }) => {
  const safeContent = typeof content === 'string' ? content : '';
  if (!safeContent.trim()) {
    return (
      <div className={cn("text-muted-foreground italic text-sm py-2", className)}>
        No specifications provided yet.
      </div>
    );
  }

  const sanitizedHtml = renderMarkdownHtml(safeContent);

  return (
    <div 
      className={cn("markdown-body", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

// Backward-compatibility alias for renderSimpleMarkdown
export const renderSimpleMarkdown = (md: string) => {
  return <MarkdownContent content={md} />;
};

export interface MarkdownEditorProps {
  label?: string;
  description?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  required?: boolean;
  className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  label,
  description,
  error,
  value,
  onChange,
  placeholder = "Write comprehensive specifications in Markdown...",
  rows = 8,
  minHeight,
  required,
  className,
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const safeValue = typeof value === 'string' ? value : '';

  /**
   * Surrounds selected text or inserts formatted placeholder
   */
  const insertFormat = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? safeValue.length;
    const end = textarea.selectionEnd ?? safeValue.length;
    const selectedText = safeValue.substring(start, end);
    const textToInsert = selectedText || defaultText;
    const replacement = `${before}${textToInsert}${after}`;

    const newValue = safeValue.substring(0, start) + replacement + safeValue.substring(end);
    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorStart = start + before.length;
      const newCursorEnd = newCursorStart + textToInsert.length;
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    });
  };

  /**
   * Block-level formatting (e.g. lists, blockquotes, code blocks)
   */
  const insertBlock = (prefix: string, defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? safeValue.length;
    const end = textarea.selectionEnd ?? safeValue.length;
    const selectedText = safeValue.substring(start, end) || defaultText;

    const lines = selectedText.split('\n');
    const formatted = lines.map((l) => `${prefix}${l}`).join('\n');

    const beforeText = safeValue.substring(0, start);
    const needsLeadingNewline = beforeText.length > 0 && !beforeText.endsWith('\n');
    const insertion = `${needsLeadingNewline ? '\n' : ''}${formatted}\n`;

    const newValue = safeValue.substring(0, start) + insertion + safeValue.substring(end);
    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + insertion.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  /**
   * Indentation / Tab key support
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart ?? safeValue.length;
      const end = textarea.selectionEnd ?? safeValue.length;
      const newValue = safeValue.substring(0, start) + '  ' + safeValue.substring(end);
      onChange(newValue);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 2);
      });
    }
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <FormLabel required={required} className="text-xs font-semibold">
            {label}
          </FormLabel>
        )}

        {/* Write / Preview Tab Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-surface-2 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
              mode === 'write'
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit3 className="w-3 h-3" /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer",
              mode === 'preview'
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
      </div>

      {description && <FormDescription>{description}</FormDescription>}

      <div className="rounded-xl border border-border overflow-hidden bg-surface-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {mode === 'write' ? (
          <>
            {/* Rich Markdown Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-surface-2/70 border-b border-border/60">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('**', '**', 'bold text')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Bold (**text**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('*', '*', 'italic text')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Italic (*text*)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('~~', '~~', 'strikethrough')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Strikethrough (~~text~~)"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-border/80 mx-1" />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('# ', '', 'Heading 1')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Heading 1 (# text)"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('## ', '', 'Heading 2')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Heading 2 (## text)"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('### ', '', 'Heading 3')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Heading 3 (### text)"
              >
                <Heading3 className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-border/80 mx-1" />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertBlock('- ', 'List item')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Bullet List (- item)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertBlock('1. ', 'Numbered item')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Numbered List (1. item)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertBlock('> ', 'Quotation')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Blockquote (> quote)"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-border/80 mx-1" />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('`', '`', 'code')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Inline Code (`code`)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('```typescript\n', '\n```', '// Code snippet here')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Code Block (```code```)"
              >
                <FileCode className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('[', '](https://example.com)', 'Link label')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Hyperlink ([title](url))"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('| Column 1 | Column 2 |\n| :--- | :--- |\n| Val A | Val B |\n', '', '')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Markdown Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertFormat('\n---\n', '', '')}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded cursor-pointer transition-colors"
                title="Horizontal Divider (---)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              rows={rows}
              value={safeValue}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={minHeight ? { minHeight } : undefined}
              className="w-full p-4 text-sm font-mono bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-y min-h-[180px] leading-relaxed"
            />
          </>
        ) : (
          /* Live Interactive Preview */
          <div className="p-6 bg-surface-0 min-h-[220px] max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/50 text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 text-primary font-semibold">
                <Eye className="w-3.5 h-3.5" /> Live Rendered Preview
              </span>
              <span>GFM Compliant</span>
            </div>

            {safeValue.trim() ? (
              <MarkdownContent content={safeValue} />
            ) : (
              <div className="py-12 text-center text-muted-foreground italic text-xs">
                No content to preview yet. Switch to &quot;Write&quot; mode to compose specifications.
              </div>
            )}
          </div>
        )}
      </div>

      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
};

export default MarkdownEditor;
