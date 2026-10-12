import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Textarea as UiTextarea } from '@/components/ui/Textarea';
import { FormLabel } from '@/components/forms/FormControls';
import { CARD_HOOK_MAX_LENGTH } from '@/config/card';
import { cn } from '@/lib/utils';

export interface CaptionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  label?: string;
}

export const CaptionInput: React.FC<CaptionInputProps> = ({
  value,
  onChange,
  placeholder = 'e.g. High-throughput distributed web systems with resilient architecture',
  id = 'caption',
  label = 'Caption (Short Sub-heading)',
}) => {
  const currentLength = (value || '').length;
  const isOverLimit = currentLength > CARD_HOOK_MAX_LENGTH;
  const isAtLimit = currentLength === CARD_HOOK_MAX_LENGTH;
  const isNearLimit = currentLength >= Math.floor(CARD_HOOK_MAX_LENGTH * 0.9) && !isAtLimit && !isOverLimit;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Block typing past the limit, while still allowing shortening/deleting if already over the limit
    if (val.length > CARD_HOOK_MAX_LENGTH && val.length > (value || '').length) {
      return;
    }
    onChange(val);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? target.value.length;
    const currentVal = target.value;
    const prefix = currentVal.slice(0, start);
    const suffix = currentVal.slice(end);

    const remainingAllowed = Math.max(0, CARD_HOOK_MAX_LENGTH - prefix.length - suffix.length);
    const inserted = pastedText.slice(0, remainingAllowed);
    const nextVal = prefix + inserted + suffix;
    onChange(nextVal);
  };

  return (
    <div className="space-y-1.5 w-full">
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <div className="relative">
        <UiTextarea
          id={id}
          value={value || ''}
          rows={2}
          maxLength={CARD_HOOK_MAX_LENGTH}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={() => onChange((value || '').trim())}
          placeholder={placeholder}
          className={cn(
            "min-h-[72px] resize-y leading-relaxed text-xs sm:text-sm",
            isOverLimit && 'border-red-500/60 focus-visible:ring-red-500/20'
          )}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] mt-1 select-none">
        <span className="text-text-muted">Short hook shown on cards. Max {CARD_HOOK_MAX_LENGTH} characters.</span>
        <div className="flex items-center gap-2">
          {isOverLimit && (
            <span className="text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              Shorten for cards
            </span>
          )}
          <span
            className={cn(
              "font-mono font-medium",
              isOverLimit || isAtLimit
                ? "text-red-500 font-bold"
                : isNearLimit
                ? "text-amber-500 font-semibold"
                : "text-text-muted"
            )}
          >
            {currentLength} / {CARD_HOOK_MAX_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
};
