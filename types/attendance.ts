import type { DataModel } from '@/convex/_generated/dataModel';

// 出欠のステータス（Convexのschema.tsと合わせる）
export type TStatus = DataModel['attendances']['document']['status'];

// メンバー情報
export type TMember = {
  _id: string; // usersテーブルの_id
  name: string;
  part: string; // パート情報
};

// イベント（練習日程）情報
export type TEvent = DataModel['events']['document'];

// 出欠情報
export type TAttendance = DataModel['attendances']['document'];
