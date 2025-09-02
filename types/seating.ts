import type { useQuery } from 'convex/react';
import type { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

// getSeatingChartByConcertクエリの返り値の型
export type TSeating = NonNullable<
  ReturnType<typeof useQuery<typeof api.seatings.getSeatingChart>>
>[number];

// partsテーブルのドキュメントの型
export type TPart = Doc<'parts'>;

// メンバーリスト用の型
export type TMemberListMember = {
  _id: Doc<'users'>['_id'];
  name: string;
  part: string;
  imageUrl?: string;
};
