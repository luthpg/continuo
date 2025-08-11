'use client';

import { CalendarIcon, Clock, MapPin } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// 他のファイルでも使えるように型定義をエクスポート
export type TEvent = {
  _id: string;
  title: string;
  startAt: string; // ISO 8601形式の文字列
  endAt: string;
  location: string;
  concertName: string;
};

type EventListProps = {
  date: Date;
  events: TEvent[];
};

export function EventList({ date, events }: EventListProps) {
  // propsで受け取った日付に該当するイベントをフィルタリング＆ソート
  const filteredEvents = events
    .filter(
      (event) => new Date(event.startAt).toDateString() === date.toDateString(),
    )
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

  // 時間のフォーマット関数
  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="w-full lg:w-96 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          {date.toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </h2>
        <Button>＋ 新規追加</Button>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <Card
              key={event._id}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              <CardContent className="p-4 flex gap-4">
                {/* デザイン案の左側のカラーバー */}
                <div className="w-1.5 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="font-bold text-lg">{event.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Clock size={14} />
                    <span>
                      {formatTime(event.startAt)} - {formatTime(event.endAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      あなたの出欠
                    </p>
                    {/* shadcn/uiのToggleGroupを使用してボタンをグループ化 */}
                    <ToggleGroup
                      type="single"
                      defaultValue="present"
                      variant="outline"
                    >
                      <ToggleGroupItem value="present" aria-label="出席">
                        出席
                      </ToggleGroupItem>
                      <ToggleGroupItem value="absent" aria-label="欠席">
                        欠席
                      </ToggleGroupItem>
                      <ToggleGroupItem value="pending" aria-label="未定">
                        未定
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="flex flex-col items-center justify-center text-center p-10 border-dashed">
            <CalendarIcon size={48} className="text-muted-foreground mb-4" />
            <p className="font-semibold">予定はありません</p>
            <p className="text-sm text-muted-foreground">
              別の日付を選択してください。
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
