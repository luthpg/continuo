'use client';

import { useQuery } from 'convex/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AttendanceTable } from '@/components/custom/AttendanceTable';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

function CalendarPageContent() {
  const searchParams = useSearchParams();
  const concertId = searchParams.get('concertId') as Id<'concerts'> | null;

  // Convexからデータを取得
  // concertIdがnullの場合はクエリをスキップ
  const members = useQuery(
    api.users.getMembersByConcert,
    concertId ? { concertId } : 'skip',
  );
  const events = useQuery(
    api.events.getEventsByConcert,
    concertId ? { concertId } : 'skip',
  );
  const attendances = useQuery(
    api.attendances.getAttendancesByConcert,
    concertId ? { concertId } : 'skip',
  );
  const concert = useQuery(
    api.concerts.getConcertById,
    concertId ? { id: concertId } : 'skip',
  );

  // データ取得中かどうかを判定
  const isLoading =
    concertId && (!members || !events || !attendances || !concert);

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">出欠管理</h1>
          {concertId ? (
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
      ) : concertId && members && events && attendances ? (
        <AttendanceTable
          members={members}
          events={events}
          initialAttendances={attendances}
          concertId={concertId}
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

// Suspenseでラップして、useSearchParamsの使用をNext.jsに正しく伝える
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
