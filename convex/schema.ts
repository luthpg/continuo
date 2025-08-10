import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ユーザー情報 (Clerkと連携)
  users: defineTable({
    clerkId: v.string(), // ClerkのユーザーID
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  }).index('by_clerk_id', ['clerkId']), // Clerk IDでユーザーを検索できるようにインデックスを設定

  // 団体情報
  organizations: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    // テーマカラーをHEX形式などで保存
    themeColor: v.optional(v.string()),
  }),

  // ユーザーと団体の所属情報
  memberships: defineTable({
    userId: v.id('users'),
    organizationId: v.id('organizations'),
    role: v.union(v.literal('admin'), v.literal('member')), // 役割（管理者 or 一般メンバー）
  }).index('by_user_org', ['userId', 'organizationId']),

  // 演奏会プロジェクト
  concerts: defineTable({
    organizationId: v.id('organizations'),
    name: v.string(),
    date: v.optional(v.string()), // 日付はISO 8601形式の文字列で保存
  }).index('by_organization', ['organizationId']),

  // 練習などの日程
  events: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'), // どの演奏会に紐づくか
    title: v.string(),
    startAt: v.string(), // 開始日時 (ISO 8601)
    endAt: v.string(), // 終了日時 (ISO 8601)
  }).index('by_concert', ['concertId']),

  // 出欠情報
  attendances: defineTable({
    eventId: v.id('events'),
    userId: v.id('users'),
    status: v.union(
      v.literal('present'), // 出席
      v.literal('absent'), // 欠席
      v.literal('pending'), // 未定
    ),
  }).index('by_event_user', ['eventId', 'userId']),

  // 楽譜や録音データなどのアセット
  assets: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    name: v.string(),
    type: v.union(v.literal('score'), v.literal('recording')), // 楽譜か録音か
    fileUrl: v.string(), // ConvexのFile Storage機能で得られるURL
  }).index('by_concert_asset', ['concertId']),

  // 必要に応じて他のテーブル（座席表など）もここに追加します
});
