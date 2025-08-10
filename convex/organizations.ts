import { v } from 'convex/values';
import { query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

// 団体情報を取得
export const get = query({
  args: {
    id: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    // 認証チェック: ユーザーがログインしているか確認
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    const clerkUserId = identity.subject;

    // 認証チェック: ユーザーが演奏会情報の閲覧権限を持っているか確認
    const isAuthed = await isValidRoleUser(ctx, clerkUserId, {
      organizationId: args.id,
    });
    if (!isAuthed) {
      throw Error('Not authorized');
    }

    // データベースから検索
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_id', (q) => q.eq('_id', args.id))
      .first();

    return organization;
  },
});
