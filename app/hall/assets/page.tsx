'use client';

import { useQuery } from 'convex/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AssetCard } from '@/components/custom/AssetCard';
import { UploadAssetDialog } from '@/components/custom/UploadAssetDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

function AssetsPageContent() {
  const searchParams = useSearchParams();
  const concertId = searchParams.get('concertId') as Id<'concerts'> | null;
  const organizationId = searchParams.get(
    'organizationId',
  ) as Id<'organizations'> | null;

  const assets = useQuery(
    api.assets.getAssetsByConcert,
    concertId ? { concertId } : 'skip',
  );

  const isLoading = concertId && assets === undefined;

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">アセット管理</h1>
          <p className="text-sm text-muted-foreground">
            楽譜や参考音源などのファイルを管理します。
          </p>
        </div>
        {concertId && organizationId && (
          <UploadAssetDialog
            concertId={concertId}
            organizationId={organizationId}
          />
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      )}

      {concertId && assets && assets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
      )}

      {(!concertId || (assets && assets.length === 0)) && !isLoading && (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] text-center text-muted-foreground bg-muted/50 rounded-lg">
          <p className="text-lg font-semibold">
            {concertId ? 'アセットがありません' : '演奏会を選択してください'}
          </p>
          <p className="text-sm">
            {concertId
              ? '右上の「＋ 新規アップロード」からファイルを追加できます。'
              : 'ヘッダーのドロップダウンから表示したい演奏会を選択してください。'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AssetsPageContent />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">アセット管理</h1>
          <p className="text-sm text-muted-foreground">
            楽譜や参考音源などのファイルを管理します。
          </p>
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
