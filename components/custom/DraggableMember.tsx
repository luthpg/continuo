import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { TMemberListMember } from '@/types/seating';

type DraggableMemberProps = {
  member: TMemberListMember & { displayName?: string | null };
  isDragging?: boolean;
  isDraggable?: boolean;
};

export function DraggableMember({
  member,
  isDragging = false,
  isDraggable = true,
}: DraggableMemberProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: member._id,
    disabled: !isDraggable,
  });

  const name = member.displayName ?? member.name;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-1.5 rounded-md flex items-center gap-2 bg-background border cursor-grab w-full',
        isDragging && 'shadow-lg z-50 opacity-80',
      )}
    >
      <div {...listeners} {...attributes} className="p-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Avatar className="h-7 w-7">
        <AvatarImage src={member.imageUrl} />
        <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="text-xs font-medium truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {member.part}
        </p>
      </div>
    </div>
  );
}
