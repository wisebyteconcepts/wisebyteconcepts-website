import React, { useState, useId, useRef, useEffect } from 'react';
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
import { GripVertical, Trash2, Plus, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { IconPicker } from '@/components/IconPicker';
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
  defaultIcon?: string;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateIcon: (icon: any) => void;
  onDelete: () => void;
}

const SortableItemRow: React.FC<SortableItemRowProps> = ({
  id,
  index,
  item,
  defaultIcon = 'CheckCircle2',
  onUpdateTitle,
  onUpdateDescription,
  onUpdateIcon,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const iconButtonRef = useRef<HTMLButtonElement>(null);

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

  const currentIcon = item.icon || defaultIcon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl border border-border bg-surface-2 transition-all shadow-2xs hover:border-primary/40 overflow-hidden",
        isDragging && "opacity-60 border-primary shadow-md bg-surface-3",
        isExpanded && "border-primary/30 ring-1 ring-primary/20"
      )}
    >
      {/* Title / Expander Header Row */}
      <div
        className="flex items-center gap-2 p-2 sm:p-2.5 cursor-pointer select-none"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        {/* Drag handle on the title row - expanding/collapsing does not interfere with dragging */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded-lg transition-colors shrink-0"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Row Index Indicator */}
        <span className="text-[10px] font-mono text-muted-foreground font-semibold w-4 text-center shrink-0">
          {index + 1}
        </span>

        {/* Feature Icon on the left with Icon Picker */}
        <button
          ref={iconButtonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsPickerOpen(true);
          }}
          title="Change icon"
          className="w-7 h-7 rounded-lg bg-surface-1 hover:bg-surface-3 border border-border/80 flex items-center justify-center shrink-0 text-primary transition-all cursor-pointer shadow-2xs hover:border-primary/50 group/icon"
        >
          <Icon
            value={currentIcon}
            className="w-3.5 h-3.5 group-hover/icon:scale-110 transition-transform text-primary"
            fallback={CheckCircle2}
          />
        </button>

        <IconPicker
          isOpen={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          onSelect={(selected) => onUpdateIcon(selected)}
          selectedIcon={currentIcon}
          triggerRef={iconButtonRef}
        />

        {/* Feature Name as Expander Title (Editable) */}
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={item.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Feature / deliverable name..."
            className="w-full text-xs font-semibold text-foreground bg-transparent px-2 py-1 rounded-lg border border-transparent hover:border-border focus:border-primary focus:bg-surface-1 focus:outline-none transition-all truncate"
          />
        </div>

        {/* Hover Delete Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete item"
          className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all shrink-0 cursor-pointer focus:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Expand / Collapse Chevron */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          aria-expanded={isExpanded}
          title={isExpanded ? "Collapse" : "Expand to view/edit description"}
          className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-transform shrink-0 cursor-pointer"
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded && "rotate-180 text-primary"
            )}
          />
        </button>
      </div>

      {/* Expanded Section: Editable Description Text Field */}
      {isExpanded && (
        <div
          className="pt-2 pb-3 px-3 sm:px-3.5 border-t border-border/60 bg-surface-1/50 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <span className="text-[10px] text-muted-foreground font-mono">
              Optional specifications & details
            </span>
          </div>
          <textarea
            value={item.description || ''}
            onChange={(e) => onUpdateDescription(e.target.value)}
            placeholder="Add detailed specifications, deliverables scope, or execution methodology..."
            rows={2}
            className="w-full p-2.5 text-xs text-foreground bg-surface-2 border border-border rounded-lg placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y leading-relaxed font-sans"
          />
        </div>
      )}
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
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState<any>(defaultIcon);
  const [isNewIconPickerOpen, setIsNewIconPickerOpen] = useState(false);
  const newIconButtonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    setNewIcon(defaultIcon);
  }, [defaultIcon]);

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

  const handleAddNewItem = () => {
    if (!newTitle.trim()) return;
    const itemToAdd: ReorderableCardItem = {
      icon: newIcon || defaultIcon,
      title: newTitle.trim(),
      description: newDescription.trim(),
    };
    onChange([...items, itemToAdd]);
    setNewTitle('');
    setNewDescription('');
    setNewIcon(defaultIcon);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewItem();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && (pasted.includes(',') || pasted.includes('\n'))) {
      e.preventDefault();
      const tokens = pasted
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (tokens.length > 0) {
        const added: ReorderableCardItem[] = tokens.map((token) => ({
          icon: newIcon || defaultIcon,
          title: token,
          description: newDescription.trim(),
        }));
        onChange([...items, ...added]);
        setNewTitle('');
        setNewDescription('');
        setNewIcon(defaultIcon);
      }
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

  const handleUpdateDescription = (index: number, newDesc: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], description: newDesc };
    onChange(updated);
  };

  const handleUpdateIcon = (index: number, newIconVal: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], icon: newIconVal };
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

      <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col">
        {/* Add Feature / Deliverable Input Area */}
        <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-surface-2/60 space-y-2.5">
          {/* Top row: Icon Selector + Feature Title Textbox */}
          <div className="flex items-center gap-2">
            {/* Icon selector using the same style & behavior as list item icon selector */}
            <button
              ref={newIconButtonRef}
              type="button"
              onClick={() => setIsNewIconPickerOpen(true)}
              title="Choose icon"
              className="w-9 h-9 rounded-xl bg-surface-1 hover:bg-surface-3 border border-border/80 flex items-center justify-center shrink-0 text-primary transition-all cursor-pointer shadow-2xs hover:border-primary/50 group/newicon"
            >
              <Icon
                value={newIcon || defaultIcon}
                className="w-4 h-4 group-hover/newicon:scale-110 transition-transform text-primary"
                fallback={CheckCircle2}
              />
            </button>

            <IconPicker
              isOpen={isNewIconPickerOpen}
              onOpenChange={setIsNewIconPickerOpen}
              onSelect={(selected) => setNewIcon(selected)}
              selectedIcon={newIcon || defaultIcon}
              triggerRef={newIconButtonRef}
            />

            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={quickAddPlaceholder || "Feature / deliverable title..."}
              className="h-9 text-xs bg-surface-1 border-border flex-1"
            />
          </div>

          {/* Feature description textbox below the feature title textbox */}
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Feature / deliverable description (optional)..."
            rows={2}
            className="w-full p-2.5 text-xs text-foreground bg-surface-1 border border-border rounded-xl placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y leading-relaxed font-sans"
          />

          {/* Action Row: hint + right-aligned Add button */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-muted-foreground font-mono">
              Press Enter in title or click Add
            </span>
            <button
              type="button"
              onClick={handleAddNewItem}
              disabled={!newTitle.trim()}
              className="h-8 px-3 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Items List or Dashed Empty State */}
        <div className="flex-1 space-y-2">
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl bg-surface-2/40 flex flex-col items-center justify-center space-y-1 min-h-[140px]">
              <p className="font-semibold text-foreground">No items added yet</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                Use the form above to add features with custom icons, titles, and descriptions.
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
                      defaultIcon={defaultIcon}
                      onUpdateTitle={(val) => handleUpdateTitle(index, val)}
                      onUpdateDescription={(val) => handleUpdateDescription(index, val)}
                      onUpdateIcon={(val) => handleUpdateIcon(index, val)}
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
