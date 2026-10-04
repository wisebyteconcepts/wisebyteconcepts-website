import React from 'react';
import { Globe, Search, Image as ImageIcon } from 'lucide-react';
import { InputBlock, TextareaBlock, FormLabel } from '@/components/forms/FormControls';
import { ImageInput } from '@/components/admin/ImageInput';
import { TagInput } from '@/components/ui/TagInput';
import { cn } from '@/lib/utils';

export interface SeoFieldsProps {
  metaTitle: string;
  onMetaTitleChange: (val: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (val: string) => void;
  slug: string;
  onSlugChange: (val: string) => void;
  pathPrefix?: string; // e.g. "services" or "products"
  focusKeyword?: string;
  onFocusKeywordChange?: (val: string) => void;
  ogImage?: string;
  onOgImageChange?: (val: string | null) => void;
  keywords?: string[];
  onKeywordsChange?: (val: string[]) => void;
  defaultTitlePlaceholder?: string;
  defaultDescriptionPlaceholder?: string;
  className?: string;
}

export const SeoFields: React.FC<SeoFieldsProps> = ({
  metaTitle = '',
  onMetaTitleChange,
  metaDescription = '',
  onMetaDescriptionChange,
  slug = '',
  onSlugChange,
  pathPrefix = 'services',
  focusKeyword = '',
  onFocusKeywordChange,
  ogImage,
  onOgImageChange,
  keywords = [],
  onKeywordsChange,
  defaultTitlePlaceholder,
  defaultDescriptionPlaceholder,
  className,
}) => {
  const titleLength = metaTitle.length;
  const descriptionLength = metaDescription.length;

  const displaySnippetTitle = metaTitle || defaultTitlePlaceholder || 'Page Title | Wise Byte Concepts';
  const displaySnippetDescription =
    metaDescription ||
    defaultDescriptionPlaceholder ||
    'Scalable digital engineering solutions with architectural precision, high-performance delivery, and production reliability.';

  return (
    <div className={cn("space-y-6", className)}>
      <div className="pb-3 border-b border-border/40">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Search Engine Optimization (SEO)
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure search engine metadata, Open Graph assets, and live Google preview.
        </p>
      </div>

      {/* Google Search Snippet Preview Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-1 border border-border space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
          <Search className="w-3.5 h-3.5 text-primary" />
          <span>Google Search Result Snippet Preview</span>
        </div>

        <div className="p-4 rounded-xl bg-background border border-border/80 space-y-1.5 font-sans text-left shadow-2xs">
          {/* Breadcrumb URL */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
            <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold">
              W
            </span>
            <span className="truncate">https://wisebyteconcepts.com &rsaquo; {pathPrefix} &rsaquo; {slug || 'entry-slug'}</span>
          </div>

          {/* Clickable Blue Headline */}
          <h4 className="text-sm sm:text-base font-semibold text-blue-500 hover:underline cursor-pointer truncate">
            {displaySnippetTitle}
          </h4>

          {/* Description snippet */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {displaySnippetDescription}
          </p>
        </div>
      </div>

      {/* Meta Title with Character Counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <FormLabel className="text-xs font-semibold">Meta Title</FormLabel>
          <span
            className={cn(
              "text-[10px] font-mono",
              titleLength > 60 ? "text-amber-500 font-bold" : "text-muted-foreground"
            )}
          >
            {titleLength} / 60 recommended
          </span>
        </div>
        <InputBlock
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder={defaultTitlePlaceholder || "Primary Page Headline | Wise Byte Concepts"}
          description="Primary title displayed on browser tabs and search engine headline results."
        />
      </div>

      {/* Meta Description with Character Counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <FormLabel className="text-xs font-semibold">Meta Description</FormLabel>
          <span
            className={cn(
              "text-[10px] font-mono",
              descriptionLength > 160 ? "text-amber-500 font-bold" : "text-muted-foreground"
            )}
          >
            {descriptionLength} / 160 recommended
          </span>
        </div>
        <TextareaBlock
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          rows={3}
          placeholder={defaultDescriptionPlaceholder || "Brief descriptive snippet for algorithmic indexing and rich previews..."}
          description="Concise description snippet shown in Google search results (150–160 chars recommended)."
        />
      </div>

      {/* Slug & Focus Keyword Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputBlock
          label="URL Slug"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="e.g. enterprise-web-development"
          description={`Permanent URL endpoint: /${pathPrefix}/${slug || '...'}`}
          required
        />

        {onFocusKeywordChange !== undefined && (
          <InputBlock
            label="Focus Keyword"
            value={focusKeyword}
            onChange={(e) => onFocusKeywordChange(e.target.value)}
            placeholder="e.g. web engineering, cloud architecture"
            description="Primary keyword target for ranking optimization."
          />
        )}
      </div>

      {/* Open Graph Image Asset */}
      {onOgImageChange && (
        <div className="space-y-2">
          <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-primary" /> Open Graph Social Card Image (OG Image)
          </FormLabel>
          <ImageInput
            value={ogImage || null}
            onChange={onOgImageChange}
            description="High-resolution visual displayed when this link is shared on LinkedIn, Twitter, Slack, and Facebook (1200x630 recommended)."
          />
        </div>
      )}

      {/* Optional SEO Keywords Tag Input */}
      {onKeywordsChange && (
        <TagInput
          label="SEO Keywords"
          value={keywords}
          onChange={onKeywordsChange}
          placeholder="Add keyword and press comma/enter (or paste a list)..."
          description="Keywords and taxonomy tags for meta headers and internal search ranking."
        />
      )}
    </div>
  );
};

export default SeoFields;
