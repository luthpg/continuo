'use client';

import { useQuery } from 'convex/react';
import { Suspense } from 'react';
import { AssetCard } from '@/components/custom/AssetCard';
import { UploadAssetDialog } from '@/components/custom/UploadAssetDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import { useConcertStore } from '@/stores/concert';

function AssetsPageContent() {
  const { activeOrgId, activeConcertId } = useConcertStore();

  const assets = useQuery(
    api.assets.getAssetsByConcert,
    activeConcertId ? { concertId: activeConcertId } : 'skip',
  );

  const isLoading = activeConcertId && assets === undefined;

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">アセット管理</h1>
          <p className="text-sm text-muted-foreground">
            楽譜や参考音源などのファイルを管理します。
          </p>
        </div>
        {activeConcertId && activeOrgId && (
          <UploadAssetDialog
            concertId={activeConcertId}
            organizationId={activeOrgId}
          />
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 静的な配列のためOK
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      )}

      {activeConcertId && assets && assets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
      )}

      {(!activeConcertId || (assets && assets.length === 0)) && !isLoading && (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] text-center text-muted-foreground bg-muted/50 rounded-lg">
          <p className="text-lg font-semibold">
            {activeConcertId
              ? 'アセットがありません'
              : '演奏会を選択してください'}
          </p>
          <p className="text-sm">
            {activeConcertId
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
          // biome-ignore lint/suspicious/noArrayIndexKey: 静的な配列のためOK
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
