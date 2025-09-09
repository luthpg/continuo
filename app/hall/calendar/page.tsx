'use client';

import { useQuery } from 'convex/react';
import { Suspense, useMemo, useState } from 'react';
import { AttendanceTable } from '@/components/custom/AttendanceTable';
import { EventCrudDialog } from '@/components/custom/EventCrudDialog';
import { PartAttendanceSummary } from '@/components/custom/PartAttendanceSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { useConcertStore } from '@/stores/concert';

function CalendarPageContent() {
  const { activeConcertId, activeOrgId } = useConcertStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Doc<'events'> | undefined>(
    undefined,
  );

  const members = useQuery(
    api.users.getMembersByConcert,
    activeConcertId ? { concertId: activeConcertId } : 'skip',
  );
  const events = useQuery(
    api.events.getEventsByConcert,
    activeConcertId ? { concertId: activeConcertId } : 'skip',
  );
  const attendances = useQuery(
    api.attendances.getAttendancesByConcert,
    activeConcertId ? { concertId: activeConcertId } : 'skip',
  );
  const concert = useQuery(
    api.concerts.getConcertById,
    activeConcertId ? { id: activeConcertId } : 'skip',
  );
  const currentUser = useQuery(api.users.getCurrentUser);
  const currentUserRole = useQuery(
    api.users.getCurrentUserRole,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );

  const attendancesMap = useMemo(() => {
    if (!attendances) return new Map();
    return new Map(
      attendances.map((a) => [`${a.userId}-${a.eventId}`, a.status]),
    );
  }, [attendances]);

  const isLoading =
    activeConcertId &&
    (members === undefined ||
      events === undefined ||
      attendances === undefined ||
      concert === undefined ||
      currentUser === undefined ||
      currentUserRole === undefined);

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'subAdmin';

  const handleEventClick = (event: Doc<'events'>) => {
    if (!isAdmin) return;
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">出欠管理</h1>
          {activeConcertId ? (
            concert ? (
              <p className="text-sm text-muted-foreground">{concert.name}</p>
            ) : (
              <Skeleton className="h-5 w-48 mt-1" />
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              演奏会を選択してください
            </p>
          )}
        </div>
        {isAdmin && activeConcertId && (
          <EventCrudDialog mode="create" concertId={activeConcertId}>
            <Button>イベントを追加</Button>
          </EventCrudDialog>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="w-full h-[calc(100vh-14rem)] rounded-lg" />
      ) : activeConcertId && members && events && attendances ? (
        <Tabs defaultValue="members" className="flex-1 flex flex-col space-y-4">
          <TabsList>
            <TabsTrigger value="members">メンバー別</TabsTrigger>
            <TabsTrigger value="parts">パート別</TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="flex-1">
            {/* 編集用ダイアログ (非表示トリガー) */}
            <EventCrudDialog
              mode="edit"
              concertId={activeConcertId}
              initialData={selectedEvent}
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
            >
              <div></div>
            </EventCrudDialog>
            <Card className="h-full">
              <CardContent className="h-full p-0">
                <AttendanceTable
                  members={members}
                  events={events}
                  initialAttendances={attendances}
                  concertId={activeConcertId}
                  onEventClick={handleEventClick}
                  currentUser={currentUser ?? null}
                  isAdmin={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="parts">
            <PartAttendanceSummary
              members={members}
              events={events}
              attendances={attendancesMap}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] text-center text-muted-foreground bg-muted/50 rounded-lg">
          <p className="text-lg font-semibold">はじめに</p>
          <p>
            ヘッダーのドロップダウンから表示したい演奏会を選択してください。
          </p>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CalendarPageContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">出欠管理</h1>
          <Skeleton className="h-5 w-48 mt-1" />
        </div>
      </div>
      <Skeleton className="w-full h-[calc(100vh-14rem)] rounded-lg" />
    </div>
  );
}
