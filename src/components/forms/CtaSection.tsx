import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { InputBlock, TextareaBlock, FormLabel } from '@/components/forms/FormControls';
import { IconPicker } from '@/components/admin/IconPicker';
import { ImageInput } from '@/components/admin/ImageInput';
import { ServiceCtaVisual } from '@/types';
import { AVAILABLE_PAGES } from '@/utils/serviceMigration';
import { cn } from '@/lib/utils';

export interface CtaSectionProps {
  heading?: string;
  onHeadingChange?: (val: string) => void;
  description?: string;
  onDescriptionChange: (val: string) => void;
  buttonText: string;
  onButtonTextChange: (val: string) => void;
  buttonLink: string;
  onButtonLinkChange: (val: string) => void;
  secondaryButtonText?: string;
  onSecondaryButtonTextChange?: (val: string) => void;
  secondaryButtonLink?: string;
  onSecondaryButtonLinkChange?: (val: string) => void;
  visual?: ServiceCtaVisual;
  onVisualChange?: (val: ServiceCtaVisual | undefined) => void;
  className?: string;
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  heading = '',
  onHeadingChange,
  description = '',
  onDescriptionChange,
  buttonText = 'Get In Touch',
  onButtonTextChange,
  buttonLink = '/contact',
  onButtonLinkChange,
  secondaryButtonText = '',
  onSecondaryButtonTextChange,
  secondaryButtonLink = '',
  onSecondaryButtonLinkChange,
  visual,
  onVisualChange,
  className,
}) => {
  const [visualMode, setVisualMode] = useState<'none' | 'icon' | 'image'>(() => {
    if (!visual) return 'none';
    return visual.type === 'image' ? 'image' : 'icon';
  });

  const [hasSecondaryButton, setHasSecondaryButton] = useState<boolean>(() => {
    return Boolean(secondaryButtonText?.trim() || secondaryButtonLink?.trim());
  });

  const handleVisualModeChange = (mode: 'none' | 'icon' | 'image') => {
    setVisualMode(mode);
    if (!onVisualChange) return;

    if (mode === 'none') {
      onVisualChange(undefined);
    } else if (mode === 'icon') {
      onVisualChange({ type: 'icon', value: visual?.value || 'Sparkles' });
    } else if (mode === 'image') {
      onVisualChange({ type: 'image', value: visual?.value || '' });
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="pb-3 border-b border-border/40">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" /> Call to Action (CTA)
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure headline, conversion prompt, action buttons, and accent visual.
        </p>
      </div>

      {/* Optional CTA Accent Visual */}
      {onVisualChange && (
        <div className="space-y-3">
          <FormLabel className="text-xs font-semibold">CTA Visual Accent (Optional)</FormLabel>
          <div className="grid grid-cols-3 max-w-sm gap-2 p-1 bg-surface-2 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => handleVisualModeChange('none')}
              className={cn(
                "py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                visualMode === 'none'
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              None
            </button>
            <button
              type="button"
              onClick={() => handleVisualModeChange('icon')}
              className={cn(
                "py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                visualMode === 'icon'
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Icon
            </button>
            <button
              type="button"
              onClick={() => handleVisualModeChange('image')}
              className={cn(
                "py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center",
                visualMode === 'image'
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Media Image
            </button>
          </div>

          {visualMode === 'icon' && (
            <div className="p-4 rounded-xl bg-surface-1 border border-border">
              <IconPicker
                label="CTA Accent Icon"
                value={typeof visual?.value === 'string' ? visual.value : 'Sparkles'}
                onChange={(val) => onVisualChange({ type: 'icon', value: val })}
              />
            </div>
          )}

          {visualMode === 'image' && (
            <div className="p-4 rounded-xl bg-surface-1 border border-border">
              <ImageInput
                label="CTA Accent Image"
                value={typeof visual?.value === 'string' ? visual.value : null}
                onChange={(val) => onVisualChange({ type: 'image', value: val || '' })}
                description="Select an image asset from unified media library"
              />
            </div>
          )}
        </div>
      )}

      {/* CTA Heading (Optional / Headline) */}
      {onHeadingChange && (
        <InputBlock
          label="CTA Heading / Title"
          value={heading}
          onChange={(e) => onHeadingChange(e.target.value)}
          placeholder="e.g. Ready to engineer your next scalable breakthrough?"
          description="Bold headline banner text for the call-to-action block."
        />
      )}

      {/* CTA Body / Explanatory Description */}
      <TextareaBlock
        label="CTA Description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        rows={3}
        placeholder="Connect with our technical leads to discuss architectural requirements, timelines, and implementation..."
        description="Compelling invitation copy displayed above the action buttons."
      />

      {/* Primary Action Button */}
      <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface-1 space-y-4">
        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span>Primary Action Button</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputBlock
            label="Button Label"
            value={buttonText}
            onChange={(e) => onButtonTextChange(e.target.value)}
            placeholder="e.g. Schedule Consultation / View Live Demo"
            required
          />

          <div>
            <FormLabel required className="text-xs font-semibold">Button Destination Page</FormLabel>
            <div className="relative mt-1.5">
              <select
                value={buttonLink}
                onChange={(e) => onButtonLinkChange(e.target.value)}
                className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
              >
                {AVAILABLE_PAGES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} ({p.value})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Select from internal pages lookup.</p>
          </div>
        </div>
      </div>

      {/* Optional Secondary Action Button */}
      {onSecondaryButtonTextChange && onSecondaryButtonLinkChange && (
        <div className="space-y-3 p-4 sm:p-5 rounded-xl border border-border bg-surface-1">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-text-muted" />
              <span>Optional Secondary Action Button</span>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !hasSecondaryButton;
                setHasSecondaryButton(next);
                if (!next) {
                  onSecondaryButtonTextChange('');
                  onSecondaryButtonLinkChange('');
                } else if (!secondaryButtonText) {
                  onSecondaryButtonTextChange('Learn More');
                  onSecondaryButtonLinkChange('/services');
                }
              }}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              {hasSecondaryButton ? 'Remove Secondary Button' : '+ Enable Secondary Button'}
            </button>
          </div>

          {hasSecondaryButton && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40 animate-in fade-in duration-200">
              <InputBlock
                label="Secondary Button Label"
                value={secondaryButtonText}
                onChange={(e) => onSecondaryButtonTextChange(e.target.value)}
                placeholder="e.g. Browse Case Studies"
              />

              <div>
                <FormLabel className="text-xs font-semibold">Secondary Destination Page</FormLabel>
                <div className="relative mt-1.5">
                  <select
                    value={secondaryButtonLink || '/products'}
                    onChange={(e) => onSecondaryButtonLinkChange(e.target.value)}
                    className="w-full h-9 px-3.5 text-xs sm:text-sm rounded-xl bg-surface-2 border border-border text-foreground transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
                  >
                    {AVAILABLE_PAGES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} ({p.value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CtaSection;
