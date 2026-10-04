import React, { useState, useId } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export interface ReorderableCardItem {
  icon?: any;
  title: string;
  description?: string;
  [key: string]: any;
}

export interface ReorderableCardListProps {
  title: string;
  helperText: string;
  items: ReorderableCardItem[];
  onChange: (items: any[]) => void;
  quickAddPlaceholder?: string;
  defaultIcon?: string;
  badgeVariant?: 'primary' | 'secondary' | 'accent' | 'outline';
  className?: string;
}

interface SortableItemRowProps {
  id: string;
  index: number;
  item: ReorderableCardItem;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
}

const SortableItemRow: React.FC<SortableItemRowProps> = ({
  id,
  index,
  item,
  onUpdateTitle,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-border bg-surface-2 transition-all shadow-2xs hover:border-primary/40",
        isDragging && "opacity-60 border-primary shadow-md bg-surface-3"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded-lg transition-colors shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Row Index Indicator */}
      <span className="text-[10px] font-mono text-muted-foreground font-semibold w-4 text-center shrink-0">
        {index + 1}
      </span>

      {/* Inline Editable Title Input */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={item.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Item title..."
          className="w-full text-xs font-medium text-foreground bg-transparent px-2 py-1 rounded-lg border border-transparent hover:border-border focus:border-primary focus:bg-surface-1 focus:outline-none transition-all"
        />
      </div>

      {/* Hover Delete Action */}
      <button
        type="button"
        onClick={onDelete}
        title="Delete item"
        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all shrink-0 cursor-pointer focus:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ReorderableCardList: React.FC<ReorderableCardListProps> = ({
  title,
  helperText,
  items = [],
  onChange,
  quickAddPlaceholder = "Type and press Enter, or paste multiple lines/commas...",
  defaultIcon = "CheckCircle2",
  className,
}) => {
  const [quickAddText, setQuickAddText] = useState('');
  const listId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getItemId = (idx: number, item: ReorderableCardItem) => {
    return `${listId}-item-${idx}-${item.title.substring(0, 10)}`;
  };

  const addItemsFromText = (rawText: string) => {
    if (!rawText.trim()) return;
    const tokens = rawText
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tokens.length === 0) return;

    const newItems: ReorderableCardItem[] = tokens.map((token) => ({
      icon: defaultIcon,
      title: token,
      description: '',
    }));

    onChange([...items, ...newItems]);
    setQuickAddText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItemsFromText(quickAddText);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && (pasted.includes(',') || pasted.includes('\n'))) {
      e.preventDefault();
      addItemsFromText(pasted);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = items.findIndex((item, idx) => getItemId(idx, item) === active.id);
    const overIndex = items.findIndex((item, idx) => getItemId(idx, item) === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      onChange(arrayMove(items, activeIndex, overIndex));
    }
  };

  const handleUpdateTitle = (index: number, newTitle: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], title: newTitle };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Card className={cn("overflow-hidden border border-border bg-surface-1 flex flex-col h-full", className)}>
      <CardHeader className="p-4 sm:p-5 border-b border-border/60 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base font-bold text-foreground">
            {title}
          </CardTitle>
          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-mono font-bold">
            {items.length}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          {helperText}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col">
        {/* Quick-add Input */}
        <div className="flex items-center gap-2">
          <Input
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={quickAddPlaceholder}
            className="h-9 text-xs bg-surface-2 border-border"
          />
          <button
            type="button"
            onClick={() => addItemsFromText(quickAddText)}
            disabled={!quickAddText.trim()}
            className="h-9 px-3 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Items List or Dashed Empty State */}
        <div className="flex-1 space-y-2">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl bg-surface-2/40 flex flex-col items-center justify-center space-y-1 min-h-[140px]">
              <p className="font-semibold text-foreground">No items added yet</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                Type above and press Enter, or paste a comma-separated or multi-line list.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item, idx) => getItemId(idx, item))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <SortableItemRow
                      key={getItemId(index, item)}
                      id={getItemId(index, item)}
                      index={index}
                      item={item}
                      onUpdateTitle={(val) => handleUpdateTitle(index, val)}
                      onDelete={() => handleDelete(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReorderableCardList;
