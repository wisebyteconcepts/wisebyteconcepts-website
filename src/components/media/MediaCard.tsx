import React, { useState } from 'react';
import { 
  MoreVertical, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Film, 
  FileText, 
  Check, 
  Layers,
  FolderInput
} from 'lucide-react';
import { MediaItem } from '@/types';
import { formatBytes } from '@/utils/mediaOptimizer';
import { useMediaStore } from '@/store/mediaStore';

interface MediaCardProps {
  item: MediaItem;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onPreview: (item: MediaItem) => void;
  onOptimize?: (item: MediaItem) => void;
  onReplace?: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onMoveToFolder?: (item: MediaItem) => void;
  onAddToCollection?: (item: MediaItem) => void;
  selectable?: boolean;
  onPick?: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  isSelected = false,
  onToggleSelect,
  onPreview,
  onOptimize,
  onReplace,
  onDelete,
  onMoveToFolder,
  onAddToCollection,
  selectable = true,
  onPick,
}) => {
  const { getUsage } = useMediaStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const usages = getUsage(item.url);
  const usageCount = usages.length;

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking menu or checkbox, ignore
    if ((e.target as HTMLElement).closest('.card-action')) return;

    if (onPick) {
      onPick(item);
    } else {
      onPreview(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer bg-surface-2 flex flex-col shadow-sm ${
        isSelected
          ? 'border-accent ring-2 ring-accent/40 bg-accent-soft text-accent-soft-text'
          : 'border-border hover:border-accent/40 hover:shadow-md'
      }`}
    >
      {/* Thumbnail Aspect Box */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-1 flex items-center justify-center">
        {item.type === 'image' ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.altText || item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : item.type === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-accent-strong backdrop-blur-md flex items-center justify-center text-on-accent shadow-lg">
                <Film className="w-5 h-5 ml-0.5" />
              </div>
            </div>
            {item.duration && (
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-white">
                {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent-soft text-accent-soft-text flex items-center justify-center mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase text-text-muted font-bold">
              {item.name.split('.').pop() || 'DOC'}
            </span>
          </div>
        )}

        {/* Top left: Select checkbox */}
        {selectable && onToggleSelect && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item.id);
            }}
            className={`card-action absolute top-2 left-2 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-accent-strong border-accent-strong text-on-accent'
                : 'bg-black/60 border-white/20 text-transparent opacity-0 group-hover:opacity-100 hover:border-white/50'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}

        {/* Top right: Format badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 font-mono text-[9px] uppercase tracking-wider text-white font-bold">
          {item.optimizedFormat || item.mimeType?.split('/')[1] || item.type}
        </div>

        {/* Bottom bar overlay on hover */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(item);
            }}
            className="card-action px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-md text-[10px] font-medium text-white flex items-center gap-1"
          >
            <Eye className="w-3 h-3" /> Inspect
          </button>

          {/* Quick 3-dot menu trigger */}
          <div className="relative card-action">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-md text-white"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 bottom-8 z-50 w-44 rounded-xl bg-surface-5 border border-border p-1 shadow-popover text-xs space-y-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onPreview(item);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-overlay)] text-text-primary flex items-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5 text-text-muted" /> View & Edit
                  </button>

                  {item.type === 'image' && onOptimize && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onOptimize(item);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-overlay)] text-text-primary flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-accent" /> Resize / Optimize
                    </button>
                  )}

                  {onReplace && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onReplace(item);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-overlay)] text-text-primary flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-text-muted" /> Replace File
                    </button>
                  )}

                  {onMoveToFolder && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onMoveToFolder(item);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-overlay)] text-text-primary flex items-center gap-2"
                    >
                      <FolderInput className="w-3.5 h-3.5 text-text-muted" /> Move Folder
                    </button>
                  )}

                  {onAddToCollection && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onAddToCollection(item);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--hover-overlay)] text-text-primary flex items-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-text-muted" /> Add to Collection
                    </button>
                  )}

                  <div className="h-px bg-divider my-1" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(item);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete File
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Card Body */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
        <div className="space-y-1">
          <div className="font-semibold text-xs text-text-primary truncate" title={item.name}>
            {item.name}
          </div>
          <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
            <span>{formatBytes(item.size)}</span>
            {item.dimensions && (
              <span>
                {item.dimensions.width}×{item.dimensions.height}
              </span>
            )}
          </div>
        </div>

        {/* "Used in X places" Pill Indicator */}
        <div className="pt-2 border-t border-divider flex items-center justify-between">
          {usageCount > 0 ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 border border-success/30 text-success text-[10px] font-mono font-bold"
              title={usages.map((u) => `${u.locationTitle} (${u.field})`).join('\n')}
            >
              Used in {usageCount} place{usageCount !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-4 text-text-muted text-[10px] font-mono">
              Unused
            </span>
          )}

          {item.tags && item.tags.length > 0 && (
            <span className="text-[10px] text-text-muted truncate max-w-[90px]">
              #{item.tags[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
