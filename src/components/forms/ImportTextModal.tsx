import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  ClipboardPaste, 
  Check, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { Badge } from '@/components/ui/Badge';
import { useToastStore } from '@/store/toastStore';
import { 
  parseImportText, 
  ParseResult 
} from '@/utils/textImportParser';
import { Service, Product } from '@/types';

export interface ImportTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'Service' | 'Product';
  existingCategories: string[];
  onApplyService?: (data: Partial<Service>) => void;
  onApplyProduct?: (data: Partial<Product>) => void;
}

export const ImportTextModal: React.FC<ImportTextModalProps> = ({
  isOpen,
  onClose,
  targetType,
  existingCategories,
  onApplyService,
  onApplyProduct,
}) => {
  const [inputText, setInputText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [hasValidated, setHasValidated] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addToast = useToastStore((state) => state.addToast);

  // Sync / validate on open if input text already exists
  useEffect(() => {
    if (isOpen) {
      setClipboardNotice(null);
      if (inputText.trim()) {
        const res = parseImportText(inputText, targetType, existingCategories);
        setParseResult(res);
        setHasValidated(true);
      }
    }
  }, [isOpen, targetType]);

  const runValidation = (text: string) => {
    if (!text.trim()) {
      setParseResult(null);
      setHasValidated(false);
      return;
    }
    const res = parseImportText(text, targetType, existingCategories);
    setParseResult(res);
    setHasValidated(true);
    return res;
  };

  const handlePasteFromClipboard = async () => {
    setClipboardNotice(null);
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
        throw new Error('Clipboard API not available');
      }
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setInputText(text);
        const res = runValidation(text);
        if (res && res.isValid) {
          addToast(`Pasted and validated from clipboard (${res.type})`, 'success');
        } else if (res && res.errors.length > 0) {
          addToast(`Pasted from clipboard: ${res.errors.length} validation errors found`, 'error');
        }
      } else if (text !== undefined && text.trim() === '') {
        addToast('Clipboard is empty', 'info');
        textareaRef.current?.focus();
      }
    } catch {
      const msg = 'Clipboard access blocked. Press Ctrl/Cmd+V in the text area instead';
      setClipboardNotice(msg);
      addToast(msg, 'info');
      textareaRef.current?.focus();
    }
  };

  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    setClipboardNotice(null);
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      e.preventDefault();
      const textarea = textareaRef.current || e.currentTarget;
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const current = inputText;
      const updated = current.substring(0, start) + pastedText + current.substring(end);

      setInputText(updated);
      setTimeout(() => {
        if (textareaRef.current) {
          const nextPos = start + pastedText.length;
          textareaRef.current.setSelectionRange(nextPos, nextPos);
        }
      }, 0);

      if (updated.trim()) {
        const res = runValidation(updated);
        if (res && res.isValid) {
          addToast(`Validated successfully: ${targetType} data ready to apply`, 'success');
        } else if (res && res.errors.length > 0) {
          addToast(`Pasted text contains ${res.errors.length} validation errors`, 'error');
        }
      }
    }
  };

  const handleValidate = () => {
    if (!inputText.trim()) {
      addToast('Please paste or enter template text to validate', 'info');
      return;
    }
    const res = runValidation(inputText);
    if (res && res.isValid) {
      addToast(`Validation passed: Ready to apply ${targetType} data`, 'success');
    } else if (res && res.errors.length > 0) {
      addToast(`Found ${res.errors.length} validation errors`, 'error');
    }
  };

  const handleApply = () => {
    if (!parseResult || !parseResult.isValid || !parseResult.data) {
      addToast('Cannot apply: please fix validation errors first', 'error');
      return;
    }

    if (targetType === 'Service' && onApplyService) {
      onApplyService(parseResult.data as Partial<Service>);
      addToast('Service fields successfully populated for review', 'success');
    } else if (targetType === 'Product' && onApplyProduct) {
      onApplyProduct(parseResult.data as Partial<Product>);
      addToast('Project fields successfully populated for review', 'success');
    }

    onClose();
  };

  const lineCount = inputText ? inputText.split('\n').length : 0;

  const placeholderText = targetType === 'Service'
    ? `Paste your structured Service text here (Ctrl+V / Cmd+V)...\n\nExample format:\nTYPE: Service\nTITLE: Enterprise Cloud Architecture\nSLUG: enterprise-cloud-architecture\nCATEGORY: Development\nDELIVERED_WITHIN_UNIT: Weeks\nDELIVERED_WITHIN_RANGE: 2-4\nPRICING_MODEL: Fixed\nAMOUNT: 5000\nSHORT_DESCRIPTION:\nBrief summary description...\nFULL_DESCRIPTION:\n### Architectural Overview\nDetailed description...\nCORE_FEATURES:\n- [icon: CheckCircle2] High Availability Clusters | Active-active multi-region failover\nDELIVERABLES:\n- [icon: Package] Infrastructure as Code | Production-ready Terraform manifests`
    : `Paste your structured Product text here (Ctrl+V / Cmd+V)...\n\nExample format:\nTYPE: Product\nTITLE: Autonomous Telemetry Suite\nSLUG: autonomous-telemetry-suite\nCATEGORY: Developer Tools\nLIVE_URL: https://telemetry.example.com\nSHORT_DESCRIPTION:\nBrief summary description...\nFULL_DESCRIPTION:\n### Project Overview\nDetailed description...\nCORE_FEATURES:\n- [icon: CheckCircle2] Zero-Loss Ingestion | In-memory ring buffering\nDELIVERABLES:\n- [icon: Package] Production Binaries | Self-contained compiled daemon`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-surface-1 border border-border shadow-2xl rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-surface-2/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Import {targetType} from Text</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                    {targetType} Model
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paste structured text to quickly populate all {targetType.toLowerCase()} fields. Review before saving.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
          {/* Clipboard Blocked Notice if applicable */}
          {clipboardNotice && (
            <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="font-medium">{clipboardNotice}</span>
            </div>
          )}

          {/* Textarea Input Section with Paste Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-foreground">
                  Structured Text Input
                </label>
                {lineCount > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ({lineCount} lines)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {inputText && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputText('');
                      setParseResult(null);
                      setHasValidated(false);
                      setClipboardNotice(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive cursor-pointer px-1 py-0.5"
                  >
                    Clear text
                  </button>
                )}

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handlePasteFromClipboard}
                  className="h-8 text-xs gap-1.5 border-border bg-surface-2 hover:bg-surface-3 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-primary" />
                  <span>Paste</span>
                </Button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setClipboardNotice(null);
                setHasValidated(false);
              }}
              onPaste={handleTextareaPaste}
              placeholder={placeholderText}
              rows={12}
              className="w-full p-4 text-xs font-mono bg-surface-2 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y leading-relaxed custom-scrollbar"
            />
          </div>

          {/* Validation & Feedback Section */}
          {hasValidated && parseResult && (
            <div className="space-y-4 pt-1">
              {/* Errors Block */}
              {parseResult.errors.length > 0 && (
                <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parseResult.errors.length} Validation {parseResult.errors.length === 1 ? 'Error' : 'Errors'} Found (Must be resolved before applying)</span>
                  </div>
                  <ul className="space-y-1.5 pl-6 list-disc text-xs text-destructive/90">
                    {parseResult.errors.map((err, idx) => (
                      <li key={idx} className="leading-snug">
                        <span className="font-mono font-bold text-[11px] bg-destructive/20 px-1.5 py-0.5 rounded mr-1.5">
                          Line {err.line}
                        </span>
                        <span>{err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings Block */}
              {parseResult.warnings.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{parseResult.warnings.length} {parseResult.warnings.length === 1 ? 'Warning' : 'Warnings'} (Non-blocking notices)</span>
                  </div>
                  <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-400/90">
                    {parseResult.warnings.map((warn, idx) => (
                      <li key={idx} className="leading-snug">
                        <span className="font-mono font-bold text-[11px] bg-amber-500/20 px-1.5 py-0.5 rounded mr-1.5">
                          Line {warn.line}
                        </span>
                        <span>{warn.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Result Preview Card */}
              {parseResult.isValid && parseResult.data && (
                <div className="p-4 sm:p-5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Ready to Apply: Validated {parseResult.type} Data</span>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] font-mono">
                      0 Errors
                    </Badge>
                  </div>

                  {/* Summary of parsed fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Title</span>
                      <span className="font-bold text-foreground truncate block">{parseResult.data.title}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Slug</span>
                      <span className="font-mono text-primary text-[11px] truncate block">/{parseResult.data.slug}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Category</span>
                      <span className="font-medium text-foreground truncate block">
                        {parseResult.data.category || <span className="italic text-amber-400">Manual Selection Required</span>}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Features Parsed</span>
                      <span className="font-bold text-foreground">
                        {parseResult.data.coreFeatures?.length || 0} items
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Deliverables Parsed</span>
                      <span className="font-bold text-foreground">
                        {parseResult.data.deliverables?.length || 0} items
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Tags</span>
                      <span className="font-mono text-[11px] text-foreground truncate block">
                        {parseResult.data.tags?.length ? parseResult.data.tags.join(', ') : 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Short description preview */}
                  {parseResult.data.shortDescription && (
                    <div className="p-2.5 rounded-lg bg-surface-2/80 border border-border text-xs">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                        Short Description Excerpt
                      </span>
                      <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                        {parseResult.data.shortDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface-2/70 flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleValidate}
              disabled={!inputText.trim()}
              className="text-xs gap-1.5 border-border bg-surface-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Validate Text</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleApply}
              disabled={!parseResult || !parseResult.isValid || parseResult.errors.length > 0}
              className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to Form</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTextModal;
