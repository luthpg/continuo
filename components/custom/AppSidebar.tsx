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
import { usePathname } from 'next/navigation';
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
import { useConcertStore } from '@/stores/concert';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { activeOrgId } = useConcertStore();

  const navMain: Array<{
    title: string;
    url: string;
    icon: React.ComponentType;
    isActive: boolean;
  }> = [
    {
      title: 'ホーム',
      url: `/hall`,
      icon: Home,
      isActive: pathname === '/hall' && !pathname.includes('/hall/'),
    },
  ];
  activeOrgId &&
    navMain.push(
      {
        title: '日程・出欠',
        url: `/hall/calendar`,
        icon: CalendarDays,
        isActive: pathname.startsWith('/hall/calendar'),
      },
      {
        title: 'メンバー',
        url: `/hall/members`,
        icon: Users,
        isActive: pathname.startsWith('/hall/members'),
      },
      {
        title: 'アセット',
        url: `/hall/assets`,
        icon: Music,
        isActive: pathname.startsWith('/hall/assets'),
      },
      {
        title: '席次表',
        url: `/hall/seatings`,
        icon: FileText,
        isActive: pathname.startsWith('/hall/seatings'),
      },
      {
        title: '演奏会管理',
        url: `/hall/concerts`,
        icon: Music,
        isActive: pathname.startsWith('/hall/concerts'),
      },
    );

  const navSecondary = [
    {
      title: '団体設定',
      url: `/hall/settings`,
      icon: Settings,
      isActive: pathname.startsWith('/hall/settings'),
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" className="no-print" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={'/hall'}>
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

      {activeOrgId && (
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
      )}
    </Sidebar>
  );
}
