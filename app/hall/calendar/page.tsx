'use client';

import { useState } from 'react';
import { AttendanceTable } from '@/components/custom/AttendanceTable';
import type { TAttendance, TEvent, TMember } from '@/types/attendance';

// モックデータ (本来はConvexのuseQueryで取得します)
const MOCK_MEMBERS: TMember[] = [
  { _id: 'user1', name: '山田 太郎', part: '1st Violin' },
  { _id: 'user2', name: '佐藤 花子', part: '1st Violin' },
  { _id: 'user3', name: '鈴木 一郎', part: '2nd Violin' },
  { _id: 'user4', name: '高橋 次郎', part: '2nd Violin' },
  { _id: 'user5', name: '田中 美咲', part: 'Viola' },
  { _id: 'user6', name: '渡辺 健太', part: 'Viola' },
  { _id: 'user7', name: '伊藤 さくら', part: 'Cello' },
  { _id: 'user8', name: '山本 雄大', part: 'Cello' },
  { _id: 'user9', name: '中村 あかり', part: 'Contrabass' },
];

const MOCK_EVENTS: TEvent[] = [
  { _id: 'ev53', startAt: '2025-08-10', title: '弦セクション練習' },
  { _id: 'ev56', startAt: '2025-08-13', title: '弦セクション練習' },
  { _id: 'evt1', startAt: '2025-08-15', title: '弦セクション練習' },
  { _id: 'evt2', startAt: '2025-08-17', title: '全体合奏' },
  { _id: 'evt3', startAt: '2025-08-22', title: '金管分奏' },
  { _id: 'evt4', startAt: '2025-08-24', title: '全体合奏' },
  { _id: 'evt5', startAt: '2025-08-29', title: '木管分奏' },
  { _id: 'evt6', startAt: '2025-08-31', title: '全体合奏' },
];

const MOCK_ATTENDANCES: TAttendance[] = [
  { _id: 'att1', userId: 'user1', eventId: 'evt1', status: 'present' },
  { _id: 'att2', userId: 'user1', eventId: 'evt2', status: 'present' },
  { _id: 'att3', userId: 'user2', eventId: 'evt1', status: 'absent' },
  { _id: 'att4', userId: 'user2', eventId: 'evt2', status: 'present' },
  { _id: 'att5', userId: 'user3', eventId: 'evt1', status: 'late' },
  { _id: 'att6', userId: 'user3', eventId: 'evt2', status: 'present' },
  { _id: 'att7', userId: 'user4', eventId: 'evt1', status: 'present' },
  { _id: 'att8', userId: 'user4', eventId: 'evt2', status: 'leave_early' },
  { _id: 'att9', userId: 'user5', eventId: 'evt1', status: 'present' },
  { _id: 'att10', userId: 'user5', eventId: 'evt2', status: 'present' },
  { _id: 'att11', userId: 'user1', eventId: 'evt3', status: 'pending' },
];

export default function Page() {
  const [selectedDate, setSelectedDate] = useState(
    new Date('2025-08-17T00:00:00.000Z'),
  );

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">出欠管理</h1>
          <p className="text-sm text-muted-foreground">第50回定期演奏会</p>
        </div>
      </div>

      {/* Step 2で作成する出欠管理テーブル */}
      <AttendanceTable
        members={MOCK_MEMBERS}
        events={MOCK_EVENTS}
        initialAttendances={MOCK_ATTENDANCES}
      />
    </div>
  );
}
