'use client';

import { useQuery } from 'convex/react';
import { useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const DEFAULT_PRIMARY_COLOR = 'oklch(0.205 0 0)';
const DEFAULT_PRIMARY_FOREGROUND_COLOR = 'oklch(0.985 0 0)';

export function DynamicTheme({
  organizationId,
}: {
  organizationId: Id<'organizations'> | string;
}) {
  const organization = useQuery(
    api.organizations.get,
    organizationId ? { id: organizationId as Id<'organizations'> } : 'skip',
  );

  useEffect(() => {
    const root = window.document.documentElement;

    if (organization?.themeColor) {
      root.style.setProperty('--primary', organization.themeColor);
      root.style.setProperty(
        '--primary-foreground',
        DEFAULT_PRIMARY_FOREGROUND_COLOR,
      );
    } else {
      root.style.setProperty('--primary', DEFAULT_PRIMARY_COLOR);
      root.style.setProperty(
        '--primary-foreground',
        DEFAULT_PRIMARY_FOREGROUND_COLOR,
      );
    }
  }, [organization]);

  return null;
}
