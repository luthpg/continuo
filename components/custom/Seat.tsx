import { useDroppable } from '@dnd-kit/core';
import { DraggableMember } from '@/components/custom/DraggableMember';
import type { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import type { TSeating } from '@/types/seating';

type SeatProps = {
  seat: TSeating;
  isSwapMode?: boolean;
  onClick?: (seatId: Id<'seatings'>) => void;
  isSelected?: boolean;
};

export function Seat({ seat, isSwapMode, onClick, isSelected }: SeatProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: seat._id,
    disabled: isSwapMode, // 入れ替えモード中はドロップを無効化
  });

  const seatLabel =
    seat.type === 'plut'
      ? `${seat.number}プルト ${seat.isFrontOfPlut ? '表' : '裏'}`
      : seat.name;

  const handleClick = () => {
    if (isSwapMode && onClick) {
      onClick(seat._id);
    }
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={handleClick}
      onKeyUp={handleClick}
      className={cn(
        'w-full h-12 rounded-md border-2 flex items-center justify-center transition-colors p-1',
        isSwapMode && 'cursor-pointer hover:bg-accent',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isOver
          ? 'border-primary bg-primary/10'
          : seat.user
            ? 'border-solid border-primary/50'
            : 'border-dashed border-border',
      )}
    >
      {seat.user ? (
        <DraggableMember
          member={{
            ...seat.user,
            name: seat.user.displayName ?? seat.user.name ?? '',
            part: 'Unknown',
          }}
          isDraggable={!isSwapMode}
        />
      ) : (
        <span className="text-[10px] text-muted-foreground text-center">
          {seatLabel}
        </span>
      )}
    </button>
  );
}
