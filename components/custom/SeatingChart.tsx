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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();
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
        part: m.part,
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
        part:
          initialMembers.find((m) => m._id === memberData._id)?.part ??
          'Unknown',
        imageUrl: memberData.imageUrl,
      };
      setActiveMember(member);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveMember(null);
    const { active, over } = event;

    if (!over) return;

    const memberId = active.id as Id<'users'>;
    const targetId = over.id as string;

    if (targetId === 'unassigned-area') {
      const sourceSeat = seatingChart.find((s) => s.userId === memberId);
      if (sourceSeat) {
        await unassignMember({
          seatingId: sourceSeat._id,
          organizationId,
        });
        toast.success(`${activeMember?.name}を席から外しました。`);
      }
      return;
    }

    const targetSeatId = targetId as Id<'seatings'>;
    await assignMember({
      seatingId: targetSeatId,
      userId: memberId,
      organizationId,
    });
    toast.success(`${activeMember?.name}を配置しました。`);
  };

  const handleSeatClick = (seatId: Id<'seatings'>) => {
    if (!isSwapMode) return;

    if (!firstSeatToSwap) {
      setFirstSeatToSwap(seatId);
      toast.info('入れ替える先の席を選択してください。');
    } else {
      if (firstSeatToSwap === seatId) {
        // 同じ席をクリックしたら選択解除
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

  if (isMobile) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Tabs defaultValue="chart" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">席次表</TabsTrigger>
            <TabsTrigger value="members">メンバー</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="flex-1 overflow-y-auto">
            <OrchestraLayout seatingChart={seatingChart} parts={parts} />
          </TabsContent>
          <TabsContent value="members" className="flex-1">
            <MemberList members={unassignedMembers} />
          </TabsContent>
        </Tabs>
        <DragOverlay>
          {activeMember ? (
            <DraggableMember member={activeMember} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full">
        <div className="w-1/4">
          <MemberList members={unassignedMembers} />
        </div>
        <div className="flex-1">
          <div className="flex justify-end mb-2">
            <Button
              variant={isSwapMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setIsSwapMode(!isSwapMode);
                setFirstSeatToSwap(null); // モード切替時に選択解除
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
