'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TEvent, TMember, TStatus } from '@/types/attendance';

// attendancesはMapに変換済みのものを渡すことを想定
type PartAttendanceSummaryProps = {
  members: TMember[];
  events: TEvent[];
  attendances: Map<string, TStatus>;
};

export function PartAttendanceSummary({
  members,
  events,
  attendances,
}: PartAttendanceSummaryProps) {
  const partSummaries = useMemo(() => {
    const membersByPart = new Map<string, TMember[]>();
    members.forEach((member) => {
      const part = member.part || '未設定';
      if (!membersByPart.has(part)) {
        membersByPart.set(part, []);
      }
      membersByPart.get(part)?.push(member);
    });

    const summaries = Array.from(membersByPart.entries()).map(
      ([partName, partMembers]) => {
        const eventRates = events.map((event) => {
          let presentCount = 0;
          partMembers.forEach((member) => {
            const status = attendances.get(`${member._id}-${event._id}`);
            if (
              status === 'present' ||
              status === 'late' ||
              status === 'leave_early'
            ) {
              presentCount++;
            }
          });
          const rate = partMembers.length
            ? (presentCount / partMembers.length) * 100
            : 0;
          return { eventId: event._id, rate };
        });
        return { partName, memberCount: partMembers.length, eventRates };
      },
    );
    return summaries.sort((a, b) => a.partName.localeCompare(b.partName));
  }, [members, events, attendances]);

  const getRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-200 dark:bg-green-800';
    if (rate >= 50) return 'bg-yellow-200 dark:bg-yellow-800';
    return 'bg-red-200 dark:bg-red-800';
  };

  return (
    <div
      className="relative w-full overflow-auto rounded-lg border"
      style={{ maxHeight: 'calc(100vh - 18rem)' }}
    >
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
          <tr>
            <th className="whitespace-nowrap border-b border-r p-2 font-semibold">
              パート
            </th>
            {events.map((event) => (
              <th
                key={event._id}
                className="whitespace-nowrap border-b p-2 text-center font-semibold"
              >
                {event.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {partSummaries.map(({ partName, memberCount, eventRates }, index) => (
            <tr key={partName} className="border-b last:border-none">
              <td
                className={cn(
                  'whitespace-nowrap border-r p-2',
                  index % 2 === 0 ? 'bg-background' : 'bg-muted',
                )}
              >
                <div className="font-medium">{partName}</div>
                <div className="text-xs text-muted-foreground">
                  {memberCount}人
                </div>
              </td>
              {eventRates.map(({ eventId, rate }) => (
                <td
                  key={eventId}
                  className={cn(
                    'p-2 min-w-[5rem] text-center',
                    index % 2 === 1 && 'bg-muted',
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-semibold">{rate.toFixed(0)}%</span>
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        getRateColor(rate),
                      )}
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
