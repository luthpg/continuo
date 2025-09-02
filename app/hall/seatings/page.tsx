'use client';

import { OrganizationProfile, useOrganization } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { ThemeColorSetter } from '@/components/custom/ThemeColorSetter';
import { api } from '@/convex/_generated/api';

export default function SettingsPage() {
  const { organization } = useOrganization();

  // Clerkのorganization IDからConvexの団体情報を取得
  const convexOrganization = useQuery(
    api.organizations.getOrganizationByClerkId,
    organization ? { clerkOrgId: organization.id } : 'skip',
  );

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">団体設定</h1>
        <p className="text-sm text-muted-foreground">
          団体の基本情報やメンバー管理ができます。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-2">テーマカラー設定</h2>
          {convexOrganization ? (
            <ThemeColorSetter organization={convexOrganization} />
          ) : null}
        </div>
        <div className="lg:col-span-2">
          {/* Clerkの団体管理UI */}
          <OrganizationProfile
            routing="path"
            path="/hall/settings"
            appearance={{
              elements: {
                card: 'shadow-none border',
                navbar: 'hidden',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
