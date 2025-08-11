'use client';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TEvent } from './EventList';

type EventCalendarProps = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  events: TEvent[];
};

export function EventCalendar({
  selectedDate,
  setSelectedDate,
  events,
}: EventCalendarProps) {
  // パフォーマンスのため、イベントの日付を事前に計算してMapに格納
  const eventsByDate = useMemo(() => {
    const map = new Map<string, TEvent[]>();
    events.forEach((event) => {
      const date = new Date(event.startAt).toDateString();
      if (!map.has(date)) {
        map.set(date, []);
      }
      map.get(date)?.push(event);
    });
    return map;
  }, [events]);

  // カレンダーの日付セルコンポーネント
  const Day = ({
    date,
    isSelected,
    hasEvent,
  }: {
    date: Date;
    isSelected: boolean;
    hasEvent: boolean;
  }) => (
    <button
      type="button"
      className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
      onClick={() => setSelectedDate(date)}
    >
      {date.getDate()}
      {hasEvent && (
        <span className="absolute bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
      )}
    </button>
  );

  // カレンダーのグリッドを生成する関数
  const renderCalendarGrid = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1),
    );

    return (
      <div className="grid grid-cols-7 gap-2">
        {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
          <div
            key={d}
            className="text-center font-medium text-muted-foreground text-sm"
          >
            {d}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => (
          <Day
            key={day.toISOString()}
            date={day}
            isSelected={day.toDateString() === selectedDate.toDateString()}
            hasEvent={eventsByDate.has(day.toDateString())}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {selectedDate.getFullYear()}年{' '}
          {selectedDate.toLocaleString('ja-JP', { month: 'long' })}
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSelectedDate(
                new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)),
              )
            }
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSelectedDate(
                new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)),
              )
            }
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">{renderCalendarGrid()}</CardContent>
    </Card>
  );
}
