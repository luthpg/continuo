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
    disabled: isSwapMode,
  });

  const seatLabel =
    seat.type === 'plut'
      ? `${seat.number}${seat.isFrontOfPlut ? '表' : '裏'}`
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
        'w-full h-12 rounded-md border flex items-center justify-center transition-all p-1 group',
        // モード別スタイル
        isSwapMode && 'cursor-pointer hover:bg-accent/80',
        isSelected && 'ring-2 ring-primary ring-offset-2',

        // D&Dオーバー時スタイル
        isOver
          ? 'border-primary bg-primary/10 ring-2 ring-primary/50'
          : 'border-border',

        // メンバー有無スタイル
        seat.user
          ? 'bg-background'
          : 'bg-muted/50 border-dashed hover:border-solid hover:bg-muted',
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
        <span className="text-[10px] text-muted-foreground text-center truncate">
          {seatLabel}
        </span>
      )}
    </button>
  );
}
