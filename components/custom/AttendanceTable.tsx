'use client';

import { useMutation } from 'convex/react';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AttendanceCell,
  type AttendanceFormValues,
} from '@/components/custom/AttendanceCell';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { TAttendance, TEvent, TMember, TStatus } from '@/types/attendance';

type AttendanceData = {
  status: TStatus;
  comment?: string | null;
  instead?: string | null;
};

type AttendanceTableProps = {
  members: TMember[];
  events: TEvent[];
  initialAttendances: TAttendance[];
  concertId: Id<'concerts'>;
  onEventClick?: (event: TEvent) => void;
};

export function AttendanceTable({
  members,
  events,
  initialAttendances,
  concertId,
  onEventClick,
}: AttendanceTableProps) {
  const isMobile = useIsMobile();
  const [attendances, setAttendances] = useState(
    new Map<string, AttendanceData>(),
  );
  const [highlightedMember, setHighlightedMember] =
    useState<Id<'users'> | null>(null);

  useEffect(() => {
    setAttendances(
      new Map(
        initialAttendances.map((a) => [
          `${a.userId}-${a.eventId}`,
          { status: a.status, comment: a.comment, instead: a.instead },
        ]),
      ),
    );
  }, [initialAttendances]);

  const eventSummaries = useMemo(() => {
    const summaries = new Map<
      Id<'events'>,
      { present: number; total: number }
    >();
    for (const event of events) {
      let presentCount = 0;
      for (const member of members) {
        const status = attendances.get(`${member._id}-${event._id}`)?.status;
        if (
          status === 'present' ||
          status === 'late' ||
          status === 'leave_early'
        ) {
          presentCount++;
        }
      }
      summaries.set(event._id, {
        present: presentCount,
        total: members.length,
      });
    }
    return summaries;
  }, [events, members, attendances]);

  const updateAttendance = useMutation(api.attendances.updateAttendanceStatus);

  const handleAttendanceUpdate = (
    userId: Id<'users'>,
    eventId: Id<'events'>,
    values: AttendanceFormValues,
  ) => {
    const key = `${userId}-${eventId}`;
    const originalData = attendances.get(key) ?? { status: 'pending' };

    setAttendances((prev) => new Map(prev).set(key, values));

    toast.promise(
      updateAttendance({
        userId,
        eventId,
        concertId,
        ...values,
      }),
      {
        loading: '出欠情報を更新中...',
        success: '更新しました',
        error: (err) => {
          setAttendances((prev) => new Map(prev).set(key, originalData));
          return `更新に失敗しました: ${err.message}`;
        },
      },
    );
  };

  const formatDate = (dateStr: string) => dayjs(dateStr).format('M/DD');
  const formatDayOfWeek = (dateStr: string) => dayjs(dateStr).format('ddd');

  // Mobile View
  if (isMobile) {
    return (
      <Accordion type="multiple" className="w-full space-y-2">
        {members.map((member) => (
          <AccordionItem key={member._id} value={member._id}>
            <AccordionTrigger className="bg-muted/50 px-4 rounded-md">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.imageUrl ?? undefined} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{member.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {member.part}
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 pt-2 space-y-1">
              {events.map((event) => {
                const attendanceData = attendances.get(
                  `${member._id}-${event._id}`,
                );
                return (
                  <div
                    key={event._id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs">
                        {formatDate(event.startAt)} (
                        {formatDayOfWeek(event.startAt)})
                      </span>
                      <span className="text-sm truncate max-w-[180px]">
                        {event.title}
                      </span>
                    </div>
                    <div className="w-20">
                      <AttendanceCell
                        status={attendanceData?.status ?? 'pending'}
                        comment={attendanceData?.comment}
                        instead={attendanceData?.instead}
                        onUpdate={(values) =>
                          handleAttendanceUpdate(member._id, event._id, values)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  // Desktop View
  return (
    <div
      className="relative w-full overflow-auto rounded-lg border"
      style={{ maxHeight: 'calc(100vh - 16rem)' }}
    >
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm">
          <tr>
            <th className="sticky left-0 top-0 z-30 whitespace-nowrap border-b border-r bg-muted/95 p-2 font-semibold">
              メンバー
            </th>
            {events.map((event) => (
              <th
                key={event._id}
                className={cn(
                  'whitespace-nowrap border-b p-2 text-center font-semibold',
                  onEventClick && 'cursor-pointer hover:bg-muted',
                )}
                onClick={() => onEventClick?.(event)}
              >
                <div className="flex flex-col items-center">
                  <span>
                    {formatDate(event.startAt)} (
                    {formatDayOfWeek(event.startAt)})
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                    {event.title}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <tr
              key={member._id}
              className={cn(
                'border-b last:border-none',
                highlightedMember === member._id && 'bg-primary/10',
              )}
            >
              <td
                className={cn(
                  'sticky left-0 z-10 whitespace-nowrap border-r p-2 cursor-pointer',
                  index % 2 === 0 ? 'bg-background' : 'bg-muted',
                  highlightedMember === member._id && 'bg-primary/20',
                )}
                onClick={() =>
                  setHighlightedMember(
                    highlightedMember === member._id ? null : member._id,
                  )
                }
                onKeyUp={() =>
                  setHighlightedMember(
                    highlightedMember === member._id ? null : member._id,
                  )
                }
              >
                <div className="font-medium">{member.name}</div>
                <div className="text-xs text-muted-foreground">
                  {member.part}
                </div>
              </td>
              {events.map((event) => {
                const attendanceData = attendances.get(
                  `${member._id}-${event._id}`,
                );
                return (
                  <td
                    key={event._id}
                    className={cn(
                      'p-0 min-w-[5rem] text-center',
                      index % 2 === 1 && 'bg-muted',
                    )}
                  >
                    <AttendanceCell
                      status={attendanceData?.status ?? 'pending'}
                      comment={attendanceData?.comment}
                      instead={attendanceData?.instead}
                      onUpdate={(values) =>
                        handleAttendanceUpdate(member._id, event._id, values)
                      }
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 z-20 bg-muted/95 backdrop-blur-sm">
          <tr className="border-t">
            <th className="sticky left-0 z-30 whitespace-nowrap border-r bg-muted/95 p-2 font-semibold">
              参加人数
            </th>
            {events.map((event) => {
              const summary = eventSummaries.get(event._id);
              return (
                <td key={event._id} className="p-2 text-center font-semibold">
                  {summary?.present ?? 0} / {summary?.total ?? 0}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
