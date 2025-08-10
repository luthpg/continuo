'use client';

import { useQuery } from 'convex/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type * as React from 'react';
import { useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

// shadcn/uiのデフォルトカラー定義（例）
const DEFAULT_PRIMARY_COLOR = '222.2 47.4% 11.2%'; // dark blue
const DEFAULT_PRIMARY_FOREGROUND_COLOR = '210 40% 98%'; // almost white

export function ThemeProvider({
  organizationId,
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & {
  organizationId: Id<'organizations'>;
}) {
  const organization = useQuery(api.organizations.get, { id: organizationId });

  useEffect(() => {
    const root = window.document.documentElement;

    if (organization?.themeColor) {
      root.style.setProperty('--primary', organization.themeColor);
      // 文字色もテーマカラーに合わせて変更するロジックが必要な場合もあります。
      // root.style.setProperty("--primary-foreground", newForegroundColor);
    } else {
      // 設定がなければデフォルトのテーマカラーに戻す
      root.style.setProperty('--primary', `hsl(${DEFAULT_PRIMARY_COLOR})`);
      root.style.setProperty(
        '--primary-foreground',
        `hsl(${DEFAULT_PRIMARY_FOREGROUND_COLOR})`,
      );
    }
  }, [organization]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
