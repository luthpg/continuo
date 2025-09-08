'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useMutation } from 'convex/react';
import { ArrowLeftRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DraggableMember } from '@/components/custom/DraggableMember';
import { MemberList } from '@/components/custom/MemberList';
import { OrchestraLayout } from '@/components/custom/OrchestraLayout';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { TMember } from '@/types/member';
import type { TMemberListMember, TPart, TSeating } from '@/types/seating';

type SeatingChartProps = {
  initialSeatingChart: TSeating[];
  initialMembers: TMember[];
  parts: TPart[];
  organizationId: Id<'organizations'>;
};

export function SeatingChart({
  initialSeatingChart,
  initialMembers,
  parts,
  organizationId,
}: SeatingChartProps) {
  const [seatingChart, setSeatingChart] = useState(initialSeatingChart);
  const [unassignedMembers, setUnassignedMembers] = useState<
    TMemberListMember[]
  >([]);
  const [activeMember, setActiveMember] = useState<TMemberListMember | null>(
    null,
  );
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [firstSeatToSwap, setFirstSeatToSwap] = useState<Id<'seatings'> | null>(
    null,
  );

  const assignMember = useMutation(api.seatings.assignMemberToSeat);
  const unassignMember = useMutation(api.seatings.unassignMemberFromSeat);
  const swapSeats = useMutation(api.seatings.swapSeats);

  useEffect(() => {
    const assignedMemberIds = new Set(
      initialSeatingChart.map((seat) => seat.userId).filter(Boolean),
    );
    const unassigned = initialMembers
      .filter((member) => !assignedMemberIds.has(member._id))
      .map((m) => ({
        _id: m._id,
        name: m.name,
        displayName: m.displayName,
        part: m.part?.name ?? 'Unknown',
        imageUrl: m.imageUrl,
      }));
    setUnassignedMembers(unassigned);
    setSeatingChart(initialSeatingChart);
  }, [initialSeatingChart, initialMembers]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const memberData =
      unassignedMembers.find((m) => m._id === active.id) ||
      seatingChart.flatMap((s) => s.user).find((u) => u?._id === active.id);

    if (memberData) {
      const member = {
        _id: memberData._id,
        name: memberData.name ?? 'No Name',
        displayName: memberData.displayName,
        part:
          initialMembers.find((m) => m._id === memberData._id)?.part?.name ??
          'Unknown',
        imageUrl: memberData.imageUrl,
      };
      setActiveMember(member as TMemberListMember);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveMember(null);
    const { active, over } = event;

    if (!over) return;

    const memberId = active.id as Id<'users'>;
    const targetId = over.id as string;

    // unassigned-area (MemberList)にドロップされた場合
    if (targetId === 'unassigned-area') {
      const sourceSeat = seatingChart.find((s) => s.userId === memberId);
      if (sourceSeat) {
        toast.promise(
          unassignMember({
            seatingId: sourceSeat._id,
            organizationId,
          }),
          {
            loading: `${activeMember?.name}を席から外しています...`,
            success: `${activeMember?.name}を席から外しました。`,
            error: '操作に失敗しました。',
          },
        );
      }
      return;
    }

    // 席にドロップされた場合
    const targetSeatId = targetId as Id<'seatings'>;
    toast.promise(
      assignMember({
        seatingId: targetSeatId,
        userId: memberId,
        organizationId,
      }),
      {
        loading: `${activeMember?.name}を配置しています...`,
        success: `${activeMember?.name}を配置しました。`,
        error: '配置に失敗しました。',
      },
    );
  };

  const handleSeatClick = (seatId: Id<'seatings'>) => {
    if (!isSwapMode) return;

    if (!firstSeatToSwap) {
      setFirstSeatToSwap(seatId);
      toast.info('入れ替える先の席を選択してください。');
    } else {
      if (firstSeatToSwap === seatId) {
        setFirstSeatToSwap(null);
        return;
      }
      toast.promise(
        swapSeats({
          seat1Id: firstSeatToSwap,
          seat2Id: seatId,
          organizationId,
        }),
        {
          loading: '奏者を入れ替え中...',
          success: '入れ替えました',
          error: '入れ替えに失敗しました',
        },
      );
      setFirstSeatToSwap(null);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row gap-6 h-full">
        <div className="w-full md:w-64">
          <MemberList members={unassignedMembers} />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex justify-end mb-2">
            <Button
              variant={isSwapMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setIsSwapMode(!isSwapMode);
                setFirstSeatToSwap(null);
              }}
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              奏者入れ替えモード
            </Button>
          </div>
          <OrchestraLayout
            seatingChart={seatingChart}
            parts={parts}
            isSwapMode={isSwapMode}
            onSeatClick={handleSeatClick}
            firstSeatToSwap={firstSeatToSwap}
          />
        </div>
      </div>
      <DragOverlay>
        {activeMember ? (
          <DraggableMember member={activeMember} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
