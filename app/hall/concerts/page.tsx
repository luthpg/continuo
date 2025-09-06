'use client';

import { useQuery } from 'convex/react';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { ConcertCardActions } from '@/components/custom/ConcertCardActions';
import { ConcertCrudDialog } from '@/components/custom/ConcertCrudDialog';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { Badge } from '@/components/ui/badge';
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
          <Link
            href={`/hall/concerts/${concert._id}`}
            key={concert._id}
            className="block hover:bg-muted/50 transition-colors rounded-lg"
          >
            <Card className="flex flex-col h-full">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CardTitle>{concert.name}</CardTitle>
                    <Badge
                      variant={
                        concert.status === 'finished'
                          ? 'secondary'
                          : concert.status === 'recruiting'
                            ? 'default'
                            : 'outline'
                      }
                    >
                      {concert.status === 'planning'
                        ? '企画中'
                        : concert.status === 'recruiting'
                          ? '募集中'
                          : concert.status === 'finished'
                            ? '終了'
                            : '未設定'}
                    </Badge>
                  </div>
                  <CardDescription>{concert.date}</CardDescription>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ConcertCardActions concert={concert} />
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {concert.description ?? '説明がありません'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
