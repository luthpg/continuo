import type { useQuery } from 'convex/react';
import type { api } from '@/convex/_generated/api';

// getMembersByOrganizationクエリの返り値の型を取得
// NonNullableでnullを除外し、[number]で配列の要素の型を取得
export type TMember = NonNullable<
  ReturnType<typeof useQuery<typeof api.organizations.getMembersByOrganization>>
>[number];
