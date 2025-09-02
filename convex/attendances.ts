import { v } from 'convex/values';
// import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

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

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // TODO: ログインユーザー本人、または管理者のみが更新できるように権限チェックを追加

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
