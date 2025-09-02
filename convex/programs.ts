import { v } from 'convex/values';
import { query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * 指定された演奏会に紐づく全てのプログラム（曲目）を取得するクエリ
 */
export const getProgramsByConcert = query({
  args: {
    concertId: v.id('concerts'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const concert = await ctx.db.get(args.concertId);
    if (!concert) {
      throw new Error('Concert not found');
    }

    // 権限チェック：所属メンバーなら誰でも閲覧可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin', 'member'],
    });

    if (!isAuthed) {
      throw new Error('Not authorized');
    }

    return await ctx.db
      .query('programs')
      .withIndex('by_concert', (q) => q.eq('concertId', args.concertId))
      .order('asc')
      .collect();
  },
});
