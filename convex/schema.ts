import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ユーザー情報 (Clerkと連携)
  users: defineTable({
    clerkId: v.string(), // ClerkのユーザーID
    email: v.optional(v.string()),
    name: v.optional(v.string()),
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
    role: v.union(
      v.literal('admin'),
      v.literal('subAdmin'),
      v.literal('member'),
    ), // 役割
  })
    .index('by_user_org', ['userId', 'organizationId'])
    .index('by_role_org', ['role', 'organizationId']),

  // 演奏会
  concerts: defineTable({
    organizationId: v.id('organizations'),
    name: v.string(),
    date: v.optional(v.string()), // 日付はISO 8601形式の文字列で保存
    place: v.optional(v.string()),
    openTime: v.optional(v.string()), // 開始時刻はISO 8601形式の文字列で保存
    startTime: v.optional(v.string()), // 開始時刻はISO 8601形式の文字列で保存
    description: v.optional(v.string()),
  }).index('by_organization', ['organizationId']),

  // ユーザーと演奏会の所属情報
  concertMemberships: defineTable({
    userId: v.id('users'),
    concertId: v.id('concerts'),
    role: v.union(v.literal('admin'), v.literal('leader'), v.literal('member')), // 役割
  })
    .index('by_user_concert', ['userId', 'concertId'])
    .index('by_role_concert', ['role', 'concertId']),

  // 曲目情報
  programs: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    name: v.string(),
    description: v.optional(v.string()),
    orderIndex: v.number(),
    orderName: v.optional(v.string()),
  }).index('by_concert', ['concertId']),

  // ユーザーと曲目の所属情報
  programMemberships: defineTable({
    userId: v.id('users'),
    programId: v.id('programs'),
  }).index('by_user_program', ['userId', 'programId']),

  // 練習などの日程
  events: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'), // どの演奏会に紐づくか
    title: v.string(),
    startAt: v.string(), // 開始日時 (ISO 8601)
    endAt: v.string(), // 終了日時 (ISO 8601)
    conductor: v.optional(v.string()),
    type: v.optional(v.id('eventTypes')),
    place: v.optional(v.string()),
    description: v.optional(v.string()),
    programs: v.optional(v.array(v.id('programs'))),
  }).index('by_concert', ['concertId']),

  // 練習種別
  eventTypes: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    name: v.string(),
    themeColor: v.optional(v.string()),
  }).index('by_concert', ['concertId']),

  // 出欠情報
  attendances: defineTable({
    eventId: v.id('events'),
    userId: v.id('users'),
    status: v.union(
      v.literal('present'), // 出席
      v.literal('absent'), // 欠席
      v.literal('late'), // 遅刻
      v.literal('absent'), // 早退
      v.literal('pending'), // 未定
    ),
    comment: v.optional(v.string()),
    instead: v.optional(v.string()), // 代奏
    updatedDate: v.optional(v.string()), // 更新日時 (ISO 8601)
    updatedBy: v.id('users'),
  }).index('by_event_user', ['eventId', 'userId']),

  // 楽譜や録音データなどのアセット
  assets: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    name: v.string(),
    type: v.union(
      v.literal('score'),
      v.literal('recording'),
      v.literal('photo'),
      v.literal('text'),
      v.literal('other'),
    ),
    fileUrl: v.string(), // ConvexのFile Storage機能や、GoogleDriveなどのURL
  }).index('by_concert_asset', ['concertId']),

  // プルト/パート
  seatings: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    programId: v.id('programs'),
    partId: v.id('parts'),
    type: v.union(v.literal('plut'), v.literal('part')),
    number: v.optional(v.number()),
    isFrontOfPlut: v.optional(v.boolean()), // プルトの表かどうか
    name: v.optional(v.string()),
    userId: v.optional(v.id('users')),
  }),

  // パート情報
  parts: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    programId: v.id('programs'),
    name: v.string(),
    maxCounts: v.optional(v.number()),
  }),

  // パート所属情報
  partMemberships: defineTable({
    partId: v.id('parts'),
    userId: v.id('users'),
  }),
});
