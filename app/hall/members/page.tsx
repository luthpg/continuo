'use client';

import { OrganizationProfile } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { Suspense } from 'react';
import { DataTable } from '@/components/custom/DataTable';
import { getColumns } from '@/components/custom/DataTableColumns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import { useConcertStore } from '@/stores/concert';

function MembersPageContent() {
  const { activeOrgId } = useConcertStore();

  const members = useQuery(
    api.organizations.getMembersByOrganization,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );
  const parts = useQuery(
    api.parts.getPartsByOrganization,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">メンバー管理</h1>
          <p className="text-sm text-muted-foreground">
            メンバーの招待、役割やパートの変更ができます。
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>メンバーを招待</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>団体設定</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <OrganizationProfile routing="path" path="/hall/settings" />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {members && parts ? (
        <DataTable columns={getColumns(parts)} data={members} />
      ) : (
        <Skeleton className="w-full h-[calc(100vh-14rem)] rounded-lg" />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MembersPageContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">メンバー管理</h1>
          <p className="text-sm text-muted-foreground">
            メンバーの招待、役割の変更、削除ができます。
          </p>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="w-full h-[calc(100vh-14rem)] rounded-lg" />
    </div>
  );
}
