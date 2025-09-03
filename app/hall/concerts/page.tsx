'use client';

import { useQuery } from 'convex/react';
import { PlusCircle } from 'lucide-react';
import { ConcertCardActions } from '@/components/custom/ConcertCardActions';
import { ConcertCrudDialog } from '@/components/custom/ConcertCrudDialog';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { useConcertStore } from '@/stores/concert';

export default function ConcertsPage() {
  const { activeOrgId } = useConcertStore();

  const concerts = useQuery(
    api.concerts.getConcertsByOrganization,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );

  if (concerts === undefined) {
    return <FullPageSpinner />;
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">演奏会管理</h1>
          <p className="text-sm text-muted-foreground">
            新しい演奏会の作成や既存の演奏会の編集ができます。
          </p>
        </div>
        <ConcertCrudDialog mode="create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </ConcertCrudDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {concerts.map((concert) => (
          <Card key={concert._id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{concert.name}</CardTitle>
                <CardDescription>{concert.date}</CardDescription>
              </div>
              <ConcertCardActions concert={concert} />
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {concert.description ?? '説明がありません'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
