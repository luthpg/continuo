'use client';

import { useQuery } from 'convex/react';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { OrganizationGeneralSettings } from '@/components/custom/OrganizationGeneralSettings';
import { OrganizationMembersSettings } from '@/components/custom/OrganizationMembersSettings';
import { ThemeColorSetter } from '@/components/custom/ThemeColorSetter';
import { api } from '@/convex/_generated/api';
import { useConcertStore } from '@/stores/concert';

export default function SettingsPage() {
  const { activeOrgId } = useConcertStore();

  const organization = useQuery(
    api.organizations.get,
    activeOrgId ? { id: activeOrgId } : 'skip',
  );

  if (organization === undefined) {
    return <FullPageSpinner />;
  }

  if (organization === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>団体が見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">団体設定</h1>
        <p className="text-sm text-muted-foreground">
          団体の基本情報やメンバー管理ができます。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OrganizationGeneralSettings organization={organization} />
          <OrganizationMembersSettings organization={organization} />
        </div>
        <div className="lg:col-span-1">
          <ThemeColorSetter organization={organization} />
        </div>
      </div>
    </div>
  );
}
