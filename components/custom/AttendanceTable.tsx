// components/custom/AttendanceTable.tsx
'use client';

import dayjs from 'dayjs';
import { useState } from 'react';
import { cn } from '@/lib/utils'; // cnユーティリティをインポート
import type { TAttendance, TEvent, TMember, TStatus } from '@/types/attendance';
import { AttendanceCell } from './AttendanceCell';

type AttendanceTableProps = {
  members: TMember[];
  events: TEvent[];
  initialAttendances: TAttendance[];
};

export function AttendanceTable({
  members,
  events,
  initialAttendances,
}: AttendanceTableProps) {
  // 出欠データをStateで管理。本来はuseQueryで取得し、useMutationで更新
  const [attendances, setAttendances] = useState(
    new Map(
      initialAttendances.map((a) => [`${a.userId}-${a.eventId}`, a.status]),
    ),
  );

  // 出欠情報を更新するハンドラ
  const handleAttendanceChange = (
    userId: string,
    eventId: string,
    status: TStatus,
  ) => {
    // ここでConvexのmutationを呼び出す
    console.log(`Updating: ${userId}, ${eventId}, ${status}`);
    setAttendances((prev) => new Map(prev).set(`${userId}-${eventId}`, status));
  };

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format('M/DD');
  };

  return (
    <div
      className="relative w-full overflow-auto rounded-lg border"
      style={{ maxHeight: 'calc(100vh - 14rem)' }}
    >
      <table className="w-full border-collapse text-sm text-left">
        {/* thead全体をstickyにし、top-0で上部に固定。z-indexで他の要素より手前に表示 */}
        <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm">
          <tr>
            {/* メンバー列のヘッダー: top-0とleft-0を両方指定し、z-indexを一番高く設定 */}
            <th className="sticky left-0 top-0 z-30 whitespace-nowrap border-b border-r bg-muted/95 p-2 font-semibold">
              メンバー
            </th>
            {/* 日程列のヘッダー: top-0で上部に固定 */}
            {events.map((event) => (
              <th
                key={event._id}
                className="whitespace-nowrap border-b p-2 text-center font-semibold"
              >
                <div className="flex flex-col items-center">
                  <span>{formatDate(event.startAt)}</span>
                  <span className="text-xs text-muted-foreground">
                    {event.title}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <tr key={member._id} className="border-b last:border-none">
              {/* メンバー名のセル: left-0で左端に固定し、z-indexと背景色を設定 */}
              <td
                className={cn(
                  'sticky left-0 z-10 whitespace-nowrap border-r p-2',
                  index % 2 === 0 ? 'bg-background' : 'bg-muted', // 交互の背景色
                )}
              >
                <div className="font-medium">{member.name}</div>
                <div className="text-xs text-muted-foreground">
                  {member.part}
                </div>
              </td>
              {/* 出欠セル */}
              {events.map((event) => (
                <td
                  key={event._id}
                  className={cn('p-0 min-w-[5rem] z-auto', index % 2 === 1 && 'bg-muted')}
                >
                  <AttendanceCell
                    status={
                      attendances.get(`${member._id}-${event._id}`) ?? 'pending'
                    }
                    onStatusChange={(newStatus) =>
                      handleAttendanceChange(member._id, event._id, newStatus)
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
