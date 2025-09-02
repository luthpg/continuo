'use client';

import { UserButton } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ConcertFilter } from '@/components/custom/ConcertFilter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId') as
    | Id<'organizations'>
    | undefined;
  const concertId = searchParams.get('concertId');

  const organizations = useQuery(api.organizations.getForUser);

  const handleOrgChange = (newOrgId: string) => {
    router.push(`/hall/calendar?organizationId=${newOrgId}`);
  };

  return (
    <header className="flex flex-col md:flex-row h-auto shrink-0 items-start md:items-center gap-2 border-b px-4 py-2 lg:px-6">
      <div className="flex w-full items-center justify-between md:w-auto">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-6"
          />
        </div>
        <div className="md:hidden">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row md:items-center gap-2">
        {organizations ? (
          <Select value={organizationId} onValueChange={handleOrgChange}>
            <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="団体を選択..." />
            </SelectTrigger>
            <SelectContent>
              {organizations
                .filter((org): org is Doc<'organizations'> => !!org)
                .map((org) => (
                  <SelectItem key={org._id} value={org._id}>
                    {org.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : (
          <Skeleton className="h-10 w-full md:w-[240px]" />
        )}

        {organizationId && (
          <ConcertFilter
            organizationId={organizationId}
            currentConcertId={concertId}
          />
        )}
      </div>

      <div className="ml-auto hidden items-center gap-4 md:flex">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <HeaderContent />
    </Suspense>
  );
}

function HeaderSkeleton() {
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mx-2 data-[orientation=vertical]:h-6"
      />
      <Skeleton className="h-10 w-full md:w-[240px]" />
      <Skeleton className="h-10 hidden md:block md:w-[280px]" />
      <div className="ml-auto">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </header>
  );
}
