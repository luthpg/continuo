import type { Doc } from '@/convex/_generated/dataModel';

// 出欠のステータス（Convexのschema.tsと合わせる）
export type TStatus = Doc<'attendances'>['status'];

// メンバー情報
export type TMember = {
  _id: Doc<'users'>['_id'];
  name: string;
  part: string;
  imageUrl: string;
};

// イベント（練習日程）情報
export type TEvent = Doc<'events'>;

// 出欠情報
export type TAttendance = Doc<'attendances'>;
