import React from 'react';
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
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableCell,
  TableRow,
} from '@/components/ui/Table';

// --- Sortable Item Wrapper ---

interface SortableRowProps {
  id: string;
  children: (handleProps: any) => React.ReactNode;
  className?: string;
}

export const SortableRow: React.FC<SortableRowProps> = ({ id, children, className }) => {
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
    position: 'relative' as const,
  };

  const handleProps = {
    ...attributes,
    ...listeners,
    className: "cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors",
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "opacity-50 ring-1 ring-primary/50 bg-muted/50 shadow-2xl z-50",
        className
      )}
    >
      <TableCell className="w-10 pl-4">
        <div {...handleProps}>
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </TableCell>
      {children(handleProps)}
    </TableRow>
  );
};

// --- Sortable Context Wrapper ---

interface SortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  children: React.ReactNode;
}

export function SortableList<T extends { id: string }>({ items, onReorder, children }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <Table>
          {children}
        </Table>
      </SortableContext>
    </DndContext>
  );
}
