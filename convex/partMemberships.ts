import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * メンバーのパートを更新または作成するミューテーション
 */
export const updatePartMembership = mutation({
  args: {
    organizationId: v.id('organizations'),
    userId: v.id('users'),
    partId: v.id('parts'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 権限チェック：管理者のみ操作可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) {
      throw new Error('Not authorized to update parts.');
    }

    // 既存のパート所属情報を検索
    // 簡略化のため、ユーザーは団体内で1つのパートにのみ所属すると仮定
    const existingMembership = await ctx.db
      .query('partMemberships')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existingMembership) {
      // 存在すれば更新
      await ctx.db.patch(existingMembership._id, { partId: args.partId });
    } else {
      // 存在しなければ新規作成
      await ctx.db.insert('partMemberships', {
        userId: args.userId,
        partId: args.partId,
      });
    }
  },
});
