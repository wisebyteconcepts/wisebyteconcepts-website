import React from 'react';
import { 
  HardDrive, 
  AlertCircle 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { useMediaStore } from '@/store/mediaStore';
import { formatBytes } from '@/utils/mediaOptimizer';

interface StorageDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilterOrphaned?: () => void;
}

const MAX_STORAGE_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB mock quota

export const StorageDashboard: React.FC<StorageDashboardProps> = ({
  open,
  onOpenChange,
  onFilterOrphaned,
}) => {
  const { getStorageStats, folders } = useMediaStore();
  const stats = getStorageStats();

  const totalUsed = stats.totalBytes;
  const quotaUsedPct = Math.min(100, Math.round((totalUsed / MAX_STORAGE_QUOTA_BYTES) * 100));

  const imagePct = totalUsed > 0 ? Math.round((stats.imageBytes / totalUsed) * 100) : 0;
  const videoPct = totalUsed > 0 ? Math.round((stats.videoBytes / totalUsed) * 100) : 0;
  const filePct = totalUsed > 0 ? Math.round((stats.fileBytes / totalUsed) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-accent">
            <HardDrive className="w-5 h-5" />
            <DialogTitle className="text-lg font-bold">Storage & Asset Analytics</DialogTitle>
          </div>
          <p className="text-xs text-text-muted">
            Overview of total storage consumption, file type distributions, and orphaned assets report.
          </p>
        </DialogHeader>

        <div className="space-y-6 my-2">
          {/* Main Storage Bar */}
          <div className="p-4 rounded-xl border border-border bg-surface-1 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs text-text-muted font-semibold">Total Cloud Storage Used</span>
                <div className="text-2xl font-bold font-mono text-text-primary mt-0.5">
                  {formatBytes(totalUsed)}{' '}
                  <span className="text-xs font-normal text-text-muted font-sans">
                    of {formatBytes(MAX_STORAGE_QUOTA_BYTES)} quota
                  </span>
                </div>
              </div>
              <span className="text-sm font-mono font-bold text-accent">{quotaUsedPct}%</span>
            </div>

            {/* Segmented bar */}
            <div className="h-3 w-full bg-surface-4 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${imagePct}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`Images: ${formatBytes(stats.imageBytes)}`}
              />
              <div
                style={{ width: `${videoPct}%` }}
                className="bg-purple-500 h-full transition-all"
                title={`Videos: ${formatBytes(stats.videoBytes)}`}
              />
              <div
                style={{ width: `${filePct}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Files: ${formatBytes(stats.fileBytes)}`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-text-muted pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Images ({stats.imageCount} files • {formatBytes(stats.imageBytes)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Videos ({stats.videoCount} files • {formatBytes(stats.videoBytes)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Files ({stats.fileCount} files • {formatBytes(stats.fileBytes)})</span>
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl border border-border bg-surface-2 shadow-xs">
              <div className="text-[10px] font-mono uppercase text-text-muted">Total Files</div>
              <div className="text-lg font-bold font-mono text-text-primary mt-1">{stats.totalFiles}</div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface-2 shadow-xs">
              <div className="text-[10px] font-mono uppercase text-text-muted">Active Folders</div>
              <div className="text-lg font-bold font-mono text-text-primary mt-1">{folders.length}</div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface-2 shadow-xs">
              <div className="text-[10px] font-mono uppercase text-text-muted">Avg File Size</div>
              <div className="text-lg font-bold font-mono text-text-primary mt-1">
                {stats.totalFiles > 0 ? formatBytes(Math.round(totalUsed / stats.totalFiles)) : '0 B'}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-surface-2 shadow-xs">
              <div className="text-[10px] font-mono uppercase text-amber-500 font-bold">Orphaned Files</div>
              <div className="text-lg font-bold font-mono text-amber-500 mt-1">{stats.orphanedCount}</div>
            </div>
          </div>

          {/* Orphaned File Report Box */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  Orphaned Files Detection: {stats.orphanedCount} Unused Assets
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Files not referenced in any Service or Product. You can safely review or clean them up to free space.
                </div>
              </div>
            </div>

            {onFilterOrphaned && (
              <Button
                size="sm"
                variant="glass"
                onClick={() => {
                  onOpenChange(false);
                  onFilterOrphaned();
                }}
                className="shrink-0 rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-xs"
              >
                View Orphaned Media
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
