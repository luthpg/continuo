'use client';

import { useQuery } from 'convex/react';
import { useState } from 'react';
import { EditLayoutDialog } from '@/components/custom/EditLayoutDialog';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { SeatingChart } from '@/components/custom/SeatingChart';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useConcertStore } from '@/stores/concert';

export default function SeatingsPage() {
  const { activeOrgId, activeConcertId } = useConcertStore();
  const [selectedProgramId, setSelectedProgramId] =
    useState<Id<'programs'> | null>(null);

  // データを取得
  const members = useQuery(
    api.organizations.getMembersByOrganization,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );
  const parts = useQuery(
    api.parts.getPartsByOrganization,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );
  const programs = useQuery(
    api.programs.getProgramsByConcert,
    activeConcertId ? { concertId: activeConcertId } : 'skip',
  );
  const seatingChart = useQuery(
    api.seatings.getSeatingChart,
    activeConcertId && selectedProgramId
      ? { concertId: activeConcertId, programId: selectedProgramId }
      : 'skip',
  );

  if (!activeOrgId || !activeConcertId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>演奏会を選択してください。</p>
      </div>
    );
  }

  if (!members || !parts || !programs) {
    return <FullPageSpinner />;
  }

  // Set default program if not selected
  if (programs.length > 0 && !selectedProgramId) {
    setSelectedProgramId(programs[0]._id);
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 h-full">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">席次管理</h1>
          <p className="text-sm text-muted-foreground">
            ドラッグ＆ドロップでメンバーを配置します。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            onValueChange={(value) =>
              setSelectedProgramId(value as Id<'programs'>)
            }
            value={selectedProgramId ?? ''}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="プログラムを選択..." />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program._id} value={program._id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <EditLayoutDialog
            organizationId={activeOrgId}
            concertId={activeConcertId}
            parts={parts}
            programId={selectedProgramId}
          />
          <Button variant="outline" onClick={() => window.print()}>
            印刷
          </Button>
        </div>
      </div>
      <div className="printable-seating-chart flex-1">
        {seatingChart ? (
          <SeatingChart
            initialSeatingChart={seatingChart}
            initialMembers={members}
            parts={parts}
            organizationId={activeOrgId}
          />
        ) : (
          <FullPageSpinner />
        )}
      </div>
    </div>
  );
}
