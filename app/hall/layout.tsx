'use client';

import { useConvexAuth } from 'convex/react';
import { redirect, usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AppSidebar } from '@/components/custom/app-sidebar';
import { DynamicTheme } from '@/components/custom/DynamicTheme';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { SiteHeader } from '@/components/custom/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

function HallLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // アクセスしているページのパスを取得
  const path = usePathname();

  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId');

  // organizationIdがURLにない場合、選択ページにリダイレクト
  if (
    (organizationId == null ||
      organizationId === 'null' ||
      organizationId === '') &&
    path !== '/hall/select-org'
  ) {
    return redirect('/hall/select-org');
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 64)',
          '--header-height': 'auto',
          minHeight: 'calc(var(--spacing) * 14)',
        } as React.CSSProperties
      }
    >
      {organizationId && <DynamicTheme organizationId={organizationId} />}
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
