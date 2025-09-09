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
        const eventSummaries = events.map((event) => {
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
          return {
            eventId: event._id,
            presentCount,
            totalCount: partMembers.length,
          };
        });
        return { partName, memberCount: partMembers.length, eventSummaries };
      },
    );
    return summaries.sort((a, b) => a.partName.localeCompare(b.partName));
  }, [members, events, attendances]);

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
          {partSummaries.map(
            ({ partName, memberCount, eventSummaries }, index) => (
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
                {eventSummaries.map(({ eventId, presentCount, totalCount }) => (
                  <td
                    key={eventId}
                    className={cn(
                      'p-2 min-w-[5rem] text-center',
                      index % 2 === 1 && 'bg-muted',
                    )}
                  >
                    <span className="font-semibold">
                      {presentCount}/{totalCount}人
                    </span>
                  </td>
                ))}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
