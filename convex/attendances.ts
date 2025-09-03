import { v } from 'convex/values';
// import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * 指定された演奏会に紐づく全ての出欠情報を取得するクエリ
 */
export const getAttendancesByConcert = query({
  args: { concertId: v.id('concerts') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) {
      throw new Error('User not found');
    }

    const concert = await ctx.db.get(args.concertId);
    if (!concert) {
      throw new Error('Concert not found');
    }

    // 1. 団体管理者 (admin/subAdmin) かどうかチェック
    const orgMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', user._id).eq('organizationId', concert.organizationId),
      )
      .first();

    const isOrgAdmin =
      orgMembership && ['admin', 'subAdmin'].includes(orgMembership.role);

    // 2. 演奏会のメンバーかどうかチェック
    const concertMembership = await ctx.db
      .query('concertMemberships')
      .withIndex('by_user_concert', (q) =>
        q.eq('userId', user._id).eq('concertId', args.concertId),
      )
      .first();

    const isConcertMember = !!concertMembership;

    // 団体管理者でも演奏会メンバーでもない場合はエラー
    if (!isOrgAdmin && !isConcertMember) {
      throw new Error('Not authorized');
    }

    // 演奏会に紐づくイベントを取得
    const events = await ctx.db
      .query('events')
      .withIndex('by_concert', (q) => q.eq('concertId', args.concertId))
      .collect();

    if (events.length === 0) {
      return [];
    }

    const eventIds = events.map((e) => e._id);

    // 各イベントの出欠情報を並列で取得
    const allAttendances = await Promise.all(
      eventIds.map((eventId) =>
        ctx.db
          .query('attendances')
          .withIndex('by_event_user', (q) => q.eq('eventId', eventId))
          .collect(),
      ),
    );

    // 結果をフラットな一つの配列にまとめる
    return allAttendances.flat();
  },
});

/**
 * 出欠ステータスを更新（または新規作成）するミューテーション
 */
export const updateAttendanceStatus = mutation({
  args: {
    userId: v.id('users'),
    eventId: v.id('events'),
    status: v.union(
      v.literal('present'),
      v.literal('absent'),
      v.literal('late'),
      v.literal('leave_early'),
      v.literal('pending'),
    ),
    concertId: v.id('concerts'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const concert = await ctx.db.get(args.concertId);
    if (!concert) throw new Error('Concert not found');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const isSelf = user._id === args.userId;
    const isAdmin = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });

    if (!isSelf && !isAdmin) {
      throw new Error('Not authorized to update this attendance.');
    }

    // 既存の出欠情報を検索
    const existingAttendance = await ctx.db
      .query('attendances')
      .withIndex('by_event_user', (q) =>
        q.eq('eventId', args.eventId).eq('userId', args.userId),
      )
      .first();

    if (existingAttendance) {
      // 既存のデータがあれば更新 (patch)
      await ctx.db.patch(existingAttendance._id, {
        status: args.status,
        updatedBy: user._id,
        updatedDate: new Date().toISOString(),
      });
    } else {
      // 既存のデータがなければ新規作成 (insert)
      await ctx.db.insert('attendances', {
        userId: args.userId,
        eventId: args.eventId,
        status: args.status,
        updatedBy: user._id,
        updatedDate: new Date().toISOString(),
      });
    }
  },
});
