import { v } from 'convex/values';
import type { DataModel } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

// 指定された演奏会IDに紐づくイベント一覧を取得する
export const getEventsByConcert = query({
  // フロントエンドから受け取る引数の型を定義
  args: {
    concertId: v.id('concerts'),
  },
  handler: async (ctx, args) => {
    // 認証チェック: ユーザーがログインしているか確認
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    const clerkUserId = identity.subject;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
      .first();

    if (!user) {
      // ユーザーがConvexに存在しない場合エラー
      throw new Error('User not found');
    }

    // このユーザーがこの演奏会の権限を持っているかチェック
    const membership = await ctx.db
      .query('concertMemberships')
      .withIndex('by_user_concert', (q) =>
        q.eq('userId', user._id).eq('concertId', args.concertId),
      )
      .first();
    if (!membership) {
      throw new Error('Not authorized');
    }

    // データベースからconcertIdに一致するイベントをインデックスを使って効率的に検索
    const events = await ctx.db
      .query('events')
      .withIndex('by_concert', (q) => q.eq('concertId', args.concertId))
      .collect();

    return events;
  },
});

// 新しいイベントを作成する
export const createEvent = mutation({
  args: {
    concertId: v.id('concerts'),
    organizationId: v.id('organizations'),
    title: v.string(),
    startAt: v.string(),
    endAt: v.string(),
    conductor: v.optional(v.string()),
    description: v.optional(v.string()),
    place: v.optional(v.string()),
    programs: v.optional(v.array(v.id('programs'))),
    type: v.optional(v.id('eventTypes')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    const clerkUserId = identity.subject;

    const adminRoles: Array<
      DataModel['concertMemberships']['document']['role']
    > = ['admin'];
    const isAuthed = await isValidRoleUser(ctx, clerkUserId, {
      concertId: args.concertId,
      requiredRoles: adminRoles,
    });
    if (!isAuthed) {
      throw Error('Not authorized');
    }

    // 新しいイベントをデータベースに挿入
    const eventId = await ctx.db.insert('events', {
      concertId: args.concertId,
      organizationId: args.organizationId,
      title: args.title,
      startAt: args.startAt,
      endAt: args.endAt,
      conductor: args.conductor,
      description: args.description,
      place: args.place,
      programs: args.programs,
      type: args.type,
    });

    return eventId;
  },
});
