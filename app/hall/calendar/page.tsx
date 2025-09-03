'use client';

import { useQuery } from 'convex/react';
import { Suspense } from 'react';
import { AttendanceTable } from '@/components/custom/AttendanceTable';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import { useConcertStore } from '@/stores/concert';

function CalendarPageContent() {
  const { activeConcertId } = useConcertStore();

  // Convexからデータを取得
  // concertIdがnullの場合はクエリをスキップ
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

  // データ取得中かどうかを判定
  const isLoading =
    activeConcertId && (!members || !events || !attendances || !concert);

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
      </div>

      {isLoading ? (
        <Skeleton className="w-full h-[calc(100vh-14rem)] rounded-lg" />
      ) : activeConcertId && members && events && attendances ? (
        <AttendanceTable
          members={members}
          events={events}
          initialAttendances={attendances}
          concertId={activeConcertId}
        />
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

// Suspenseのフォールバック用スケルトンコンポーネント
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
