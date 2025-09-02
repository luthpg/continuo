import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * メンバーの役割を更新するミューテーション
 */
export const updateMemberRole = mutation({
  args: {
    organizationId: v.id('organizations'),
    targetUserId: v.id('users'),
    newRole: v.union(
      v.literal('admin'),
      v.literal('subAdmin'),
      v.literal('member'),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 操作ユーザーが管理者かどうかチェック
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin'],
    });
    if (!isAuthed) {
      throw new Error('Only admins can change roles.');
    }

    // 対象ユーザーのメンバーシップ情報を取得
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) =>
        q
          .eq('userId', args.targetUserId)
          .eq('organizationId', args.organizationId),
      )
      .first();

    if (!membership) {
      throw new Error('Membership not found.');
    }

    // 役割を更新
    await ctx.db.patch(membership._id, { role: args.newRole });
  },
});

/**
 * 団体からメンバーを削除するミューテーション
 */
export const removeMember = mutation({
  args: {
    organizationId: v.id('organizations'),
    targetUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 操作ユーザーが管理者かどうかチェック
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin'],
    });
    if (!isAuthed) {
      throw new Error('Only admins can remove members.');
    }

    // 1. メンバーシップ情報を取得して削除
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) =>
        q
          .eq('userId', args.targetUserId)
          .eq('organizationId', args.organizationId),
      )
      .first();

    if (!membership) {
      throw new Error('Membership not found.');
    }
    await ctx.db.delete(membership._id);

    // 2. 関連する席次情報から割り当てを解除
    const seatings = await ctx.db
      .query('seatings')
      .filter((q) =>
        q.and(
          q.eq(q.field('organizationId'), args.organizationId),
          q.eq(q.field('userId'), args.targetUserId),
        ),
      )
      .collect();

    for (const seat of seatings) {
      const { userId, ...rest } = seat;
      await ctx.db.replace(seat._id, rest);
    }

    // 3. 関連する出欠情報を削除
    const attendances = await ctx.db
      .query('attendances')
      .withIndex('by_user', (q) => q.eq('userId', args.targetUserId))
      .collect();

    for (const attendance of attendances) {
      await ctx.db.delete(attendance._id);
    }

    // 4. パート所属情報を削除
    const partMembership = await ctx.db
      .query('partMemberships')
      .withIndex('by_user', (q) => q.eq('userId', args.targetUserId))
      .first(); // Assuming one part per user per org for simplicity
    if (partMembership) {
      await ctx.db.delete(partMembership._id);
    }
  },
});
