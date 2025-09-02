import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index('by_clerk_id', ['clerkId']),

  organizations: defineTable({
    name: v.string(),
    ownerId: v.id('users'), // 団体の所有者を追加
    description: v.optional(v.string()),
    themeColor: v.optional(v.string()),
  }).index('by_ownerId', ['ownerId']),

  memberships: defineTable({
    userId: v.id('users'),
    organizationId: v.id('organizations'),
    role: v.union(
      v.literal('admin'),
      v.literal('subAdmin'),
      v.literal('member'),
    ),
  })
    .index('by_user_org', ['userId', 'organizationId'])
    .index('by_organization', ['organizationId']) // 団体IDでの検索用
    .index('by_user', ['userId']),

  concerts: defineTable({
    organizationId: v.id('organizations'),
    name: v.string(),
    date: v.optional(v.string()),
    place: v.optional(v.string()),
    openTime: v.optional(v.string()),
    startTime: v.optional(v.string()),
    description: v.optional(v.string()),
  }).index('by_organization', ['organizationId']),

  concertMemberships: defineTable({
    userId: v.id('users'),
    concertId: v.id('concerts'),
    role: v.union(v.literal('admin'), v.literal('leader'), v.literal('member')),
  })
    .index('by_user_concert', ['userId', 'concertId'])
    .index('by_role_concert', ['role', 'concertId']),

  programs: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    name: v.string(),
    description: v.optional(v.string()),
    orderIndex: v.number(),
    orderName: v.optional(v.string()),
  }).index('by_concert', ['concertId']),

  programMemberships: defineTable({
    userId: v.id('users'),
    programId: v.id('programs'),
  }).index('by_user_program', ['userId', 'programId']),

  events: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    title: v.string(),
    startAt: v.string(),
    endAt: v.string(),
    conductor: v.optional(v.string()),
    type: v.optional(v.id('eventTypes')),
    place: v.optional(v.string()),
    description: v.optional(v.string()),
    programs: v.optional(v.array(v.id('programs'))),
  }).index('by_concert', ['concertId']),

  eventTypes: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    name: v.string(),
    themeColor: v.optional(v.string()),
  }).index('by_concert', ['concertId']),

  attendances: defineTable({
    eventId: v.id('events'),
    userId: v.id('users'),
    status: v.union(
      v.literal('present'), // 出席
      v.literal('absent'), // 欠席
      v.literal('late'), // 遅刻
      v.literal('leave_early'), // 早退
      v.literal('pending'), // 未定
    ),
    comment: v.optional(v.string()),
    instead: v.optional(v.string()), // 代奏
    updatedDate: v.optional(v.string()),
    updatedBy: v.id('users'),
  }).index('by_event_user', ['eventId', 'userId']),

  assets: defineTable({
    storageId: v.id('_storage'),
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
    fileUrl: v.string(),
  }).index('by_concert_asset', ['concertId']),

  seatings: defineTable({
    organizationId: v.id('organizations'),
    concertId: v.id('concerts'),
    programId: v.union(v.id('programs'), v.null()),
    partId: v.id('parts'),
    type: v.union(v.literal('plut'), v.literal('part')),
    number: v.optional(v.number()),
    isFrontOfPlut: v.optional(v.boolean()),
    name: v.optional(v.string()),
    userId: v.optional(v.id('users')),
  }).index('by_concert_program', ['concertId', 'programId']),

  parts: defineTable({
    organizationId: v.id('organizations'),
    name: v.string(),
    maxCounts: v.optional(v.number()),
  }).index('by_organization', ['organizationId']),

  partMemberships: defineTable({
    partId: v.id('parts'),
    userId: v.id('users'),
  }).index('by_user', ['userId']),
});
