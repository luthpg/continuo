import { v } from 'convex/values';
import { query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

// 指定された演奏会IDに紐づくイベント一覧を取得する
export const getConcertsByOrganization = query({
  args: {
    organizationId: v.id('organizations'),
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
      organizationId: args.organizationId,
    });
    if (!isAuthed) {
      throw Error('Not authorized');
    }

    // データベースからconcertIdに一致するイベントをインデックスを使って効率的に検索
    const concerts = await ctx.db
      .query('concerts')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .collect();

    return concerts;
  },
});
