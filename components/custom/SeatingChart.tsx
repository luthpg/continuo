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
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DraggableMember } from '@/components/custom/DraggableMember';
import { MemberList } from '@/components/custom/MemberList';
import { OrchestraLayout } from '@/components/custom/OrchestraLayout';
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

  const assignMember = useMutation(api.seatings.assignMemberToSeat);
  const unassignMember = useMutation(api.seatings.unassignMemberFromSeat);

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
          <OrchestraLayout seatingChart={seatingChart} parts={parts} />
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
