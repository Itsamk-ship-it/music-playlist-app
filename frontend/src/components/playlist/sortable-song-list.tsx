'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { PlaylistSong } from '@/lib/types';

interface Props {
  items: PlaylistSong[];
  editable: boolean;
  onReorder: (songIds: string[]) => void;
  onRemove: (songId: string) => void;
}

/** Drag-and-drop reorderable list of playlist songs (owner only). */
export function SortableSongList({ items, editable, onReorder, onRemove }: Props) {
  const [order, setOrder] = useState(items);
  useEffect(() => setOrder(items), [items]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((i) => i.id === active.id);
    const newIndex = order.findIndex((i) => i.id === over.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    onReorder(next.map((i) => i.song.id));
  };

  if (!editable) {
    return (
      <div className="divide-y">
        {order.map((ps, i) => (
          <Row key={ps.id} ps={ps} index={i} />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y">
          {order.map((ps, i) => (
            <SortableRow key={ps.id} ps={ps} index={i} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function Row({ ps, index }: { ps: PlaylistSong; index: number }) {
  const s = ps.song;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-6 text-right text-sm text-muted-foreground">{index + 1}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={s.coverUrl || s.album?.coverUrl || `https://picsum.photos/seed/${s.id}/80`}
        alt={s.title}
        className="h-11 w-11 rounded-md object-cover"
      />
      <Link href={`/songs/${s.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium">{s.title}</p>
        <p className="truncate text-sm text-muted-foreground">{s.artist?.name}</p>
      </Link>
      <span className="text-sm text-muted-foreground">{formatDuration(s.duration)}</span>
    </div>
  );
}

function SortableRow({
  ps,
  index,
  onRemove,
}: {
  ps: PlaylistSong;
  index: number;
  onRemove: (songId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ps.id,
  });
  const s = ps.song;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-3 rounded-md py-2 pr-2',
        isDragging && 'z-10 bg-accent shadow-lg',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-5 text-right text-sm text-muted-foreground">{index + 1}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={s.coverUrl || s.album?.coverUrl || `https://picsum.photos/seed/${s.id}/80`}
        alt={s.title}
        className="h-11 w-11 rounded-md object-cover"
      />
      <Link href={`/songs/${s.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium">{s.title}</p>
        <p className="truncate text-sm text-muted-foreground">{s.artist?.name}</p>
      </Link>
      <span className="text-sm text-muted-foreground">{formatDuration(s.duration)}</span>
      <button
        onClick={() => onRemove(s.id)}
        className="rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
