import { useDroppable } from '@dnd-kit/core';
import { DraggableMember } from '@/components/custom/DraggableMember';
import { cn } from '@/lib/utils';
import type { TSeating } from '@/types/seating';

type SeatProps = {
  seat: TSeating;
};

export function Seat({ seat }: SeatProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: seat._id,
  });

  const seatLabel =
    seat.type === 'plut'
      ? `${seat.number}プルト ${seat.isFrontOfPlut ? '表' : '裏'}`
      : seat.name;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-full h-12 rounded-md border-2 border-dashed flex items-center justify-center transition-colors p-1',
        isOver ? 'border-primary bg-primary/10' : 'border-border',
        seat.user && 'border-solid border-primary/50',
      )}
    >
      {seat.user ? (
        <DraggableMember
          member={{ ...seat.user, part: 'Unknown' }} // パート情報は別途取得が必要
        />
      ) : (
        <span className="text-[10px] text-muted-foreground text-center">
          {seatLabel}
        </span>
      )}
    </div>
  );
}
