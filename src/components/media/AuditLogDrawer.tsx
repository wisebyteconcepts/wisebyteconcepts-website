import React from 'react';
import { 
  History, 
  Upload, 
  RefreshCw, 
  Trash2, 
  FolderInput, 
  Sparkles, 
  Clock, 
  User, 
  FileText 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/Button';
import { useMediaStore } from '@/store/mediaStore';

interface AuditLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  const { auditLogs } = useMediaStore();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload':
        return <Upload className="w-3.5 h-3.5 text-green-500" />;
      case 'replace':
        return <RefreshCw className="w-3.5 h-3.5 text-blue-500" />;
      case 'delete':
      case 'bulk_delete':
        return <Trash2 className="w-3.5 h-3.5 text-destructive" />;
      case 'move':
        return <FolderInput className="w-3.5 h-3.5 text-amber-500" />;
      case 'optimize':
        return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-white/10">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <History className="w-5 h-5" />
            <DialogTitle className="text-lg font-bold">Media Audit & Activity Log</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete compliance trail tracking who uploaded, replaced, moved, or deleted media files.
          </p>
        </DialogHeader>

        <div className="space-y-3 my-2 max-h-[60vh] overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl border border-border/50 bg-card/60 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted/60 border border-border/40 shrink-0 mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{log.mediaName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                      {log.action}
                    </span>
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-muted-foreground">{log.details}</div>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {log.performedBy}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="text-center py-10 text-xs text-muted-foreground italic">
              No audit logs recorded yet.
            </div>
          )}
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
