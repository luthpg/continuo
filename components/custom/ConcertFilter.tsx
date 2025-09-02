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
  currentConcertId,
}: {
  organizationId: Id<'organizations'>;
  currentConcertId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const concerts = useQuery(api.concerts.getConcertsByOrganization, {
    organizationId,
  });

  const handleValueChange = (concertId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('concertId', concertId);
    // ページパスを動的に取得してリダイレクト
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?${params.toString()}`);
  };

  if (!concerts) {
    return (
      <div className="w-full h-10 rounded-md bg-gray-200 animate-pulse md:w-[280px]" />
    );
  }

  return (
    <Select onValueChange={handleValueChange} value={currentConcertId ?? ''}>
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
