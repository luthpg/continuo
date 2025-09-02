'use client';

import {
  CalendarDays,
  FileText,
  Home,
  Music,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { Id } from '@/convex/_generated/dataModel';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId') as
    | Id<'organizations'>
    | undefined;

  const navMain = [
    {
      title: 'ホーム',
      url: `/hall?organizationId=${organizationId}`,
      icon: Home,
      isActive: pathname === '/hall' && !pathname.includes('/hall/'),
    },
    {
      title: '日程・出欠',
      url: `/hall/calendar?organizationId=${organizationId}`,
      icon: CalendarDays,
      isActive: pathname.startsWith('/hall/calendar'),
    },
    {
      title: 'メンバー',
      url: `/hall/members?organizationId=${organizationId}`,
      icon: Users,
      isActive: pathname.startsWith('/hall/members'),
    },
    {
      title: 'アセット',
      url: `/hall/assets?organizationId=${organizationId}`,
      icon: Music,
      isActive: pathname.startsWith('/hall/assets'),
    },
    {
      title: '席次表',
      url: `/hall/seating-charts?organizationId=${organizationId}`,
      icon: FileText,
      isActive: pathname.startsWith('/hall/seating-charts'),
    },
  ];

  const navSecondary = [
    {
      title: '団体設定',
      url: `/hall/settings?organizationId=${organizationId}`,
      icon: Settings,
      isActive: pathname.startsWith('/hall/settings'),
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={`/hall?organizationId=${organizationId}`}>
                <Music className="!size-6" />
                <span className="logo-style text-2xl font-semibold">
                  Continuo.
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={item.isActive}
                tooltip={item.title}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="mt-auto">
        <SidebarMenu>
          {navSecondary.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={item.isActive}
                tooltip={item.title}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
