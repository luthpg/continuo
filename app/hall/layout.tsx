'use client';

import { useConvexAuth, useQuery } from 'convex/react';
import { redirect, usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { AppSidebar } from '@/components/custom/AppSidebar';
import { DynamicTheme } from '@/components/custom/DynamicTheme';
import { ForceProfileSetupDialog } from '@/components/custom/ForceProfileSetupDialog';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { SiteHeader } from '@/components/custom/SiteHeader';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import { useConcertStore } from '@/stores/concert';

function HallLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // アクセスしているページのパスを取得
  const path = usePathname();

  const { activeOrgId } = useConcertStore();
  const currentUser = useQuery(api.users.getCurrentUser);

  const needsProfileSetup = !!currentUser && !currentUser.displayName;

  // organizationIdがURLにない場合、選択ページにリダイレクト
  if (activeOrgId == null && path !== '/hall/select-org') {
    return redirect('/hall/select-org');
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 64)',
          '--header-height': 'auto',
        } as React.CSSProperties
      }
    >
      {needsProfileSetup && (
        <ForceProfileSetupDialog isOpen={needsProfileSetup} />
      )}
      {activeOrgId && <DynamicTheme organizationId={activeOrgId} />}
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="@container/main flex flex-1 flex-col p-2 md:p-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return redirect('/sign-in');
  }

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <HallLayoutContent>{children}</HallLayoutContent>
    </Suspense>
  );
}
