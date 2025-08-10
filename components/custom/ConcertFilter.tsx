'use client';

import { useQuery } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export function ConcertFilter({
  organizationId,
}: {
  organizationId: Id<'organizations'>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 現在選択されている演奏会IDをURLのクエリパラメータから取得
  const selectedConcertId = searchParams.get('concertId');

  // 団体に所属する演奏会一覧をConvexからリアルタイムに取得
  const concerts = useQuery(api.concerts.getConcertsByOrganization, {
    organizationId,
  });

  // ドロップダウンの値が変更されたときの処理
  const handleValueChange = (concertId: string) => {
    // URLのクエリパラメータを更新してページを再読み込みさせる
    const params = new URLSearchParams(window.location.search);
    params.set('concertId', concertId);
    router.push(`?${params.toString()}`);
  };

  if (!concerts) {
    // データロード中はローディング表示
    return (
      <div className="w-[280px] h-10 rounded-md bg-gray-200 animate-pulse" />
    );
  }

  return (
    <Select
      onValueChange={handleValueChange}
      // URLにIDがあればそれを、なければ未選択状態にする
      value={selectedConcertId ?? ''}
    >
      <SelectTrigger className="w-full md:w-[280px]">
        <SelectValue placeholder="演奏会でフィルター" />
      </SelectTrigger>
      <SelectContent>
        {concerts.map((concert) => (
          <SelectItem key={concert._id} value={concert._id}>
            {concert.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
