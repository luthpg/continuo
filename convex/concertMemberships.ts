import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { isValidRoleUser } from './lib/role';

// 演奏会にメンバーを追加する
export const addMember = mutation({
  args: {
    concertId: v.id('concerts'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const concert = await ctx.db.get(args.concertId);
    if (!concert) throw new Error('Concert not found');

    // 権限チェック: 団体の admin/subAdmin のみ操作可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    // 既に参加済みかチェック
    const existing = await ctx.db
      .query('concertMemberships')
      .withIndex('by_user_concert', (q) =>
        q.eq('userId', args.userId).eq('concertId', args.concertId),
      )
      .first();
    if (existing) return; // 既にいれば何もしない

    await ctx.db.insert('concertMemberships', {
      concertId: args.concertId,
      userId: args.userId,
      role: 'member', // デフォルトは 'member'
    });
  },
});

// 演奏会からメンバーを削除する
export const removeMember = mutation({
  args: {
    concertMembershipId: v.id('concertMemberships'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const membership = await ctx.db.get(args.concertMembershipId);
    if (!membership) throw new Error('Membership not found');

    const concert = await ctx.db.get(membership.concertId);
    if (!concert) throw new Error('Concert not found');

    // 権限チェック
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    await ctx.db.delete(args.concertMembershipId);
  },
});

// メンバーの役割を更新する
export const updateRole = mutation({
  args: {
    concertMembershipId: v.id('concertMemberships'),
    role: v.union(v.literal('admin'), v.literal('leader'), v.literal('member')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const membership = await ctx.db.get(args.concertMembershipId);
    if (!membership) throw new Error('Membership not found');

    const concert = await ctx.db.get(membership.concertId);
    if (!concert) throw new Error('Concert not found');

    // 権限チェック
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    await ctx.db.patch(args.concertMembershipId, { role: args.role });
  },
});
