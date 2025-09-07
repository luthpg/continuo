import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * 指定された団体に紐づく全てのパート情報を取得するクエリ
 */
export const getPartsByOrganization = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin', 'member'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const parts = await ctx.db
      .query('parts')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .collect();
    return parts;
  },
});

export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    name: v.string(),
    maxCounts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const partId = await ctx.db.insert('parts', {
      organizationId: args.organizationId,
      name: args.name,
      maxCounts: args.maxCounts,
    });
    return partId;
  },
});

export const update = mutation({
  args: {
    id: v.id('parts'),
    name: v.optional(v.string()),
    maxCounts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const part = await ctx.db.get(args.id);
    if (!part) throw new Error('Part not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: part.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id('parts') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const part = await ctx.db.get(args.id);
    if (!part) throw new Error('Part not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: part.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    // 関連する partMemberships を削除
    const memberships = await ctx.db
      .query('partMemberships')
      .withIndex('by_part', (q) => q.eq('partId', args.id))
      .collect();

    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // パートを削除
    await ctx.db.delete(args.id);
  },
});

/**
 * テンプレートからパートを一括上書きするミューテーション
 */
export const overwritePartsFromTemplate = mutation({
  args: {
    organizationId: v.id('organizations'),
    partNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    // 既存のパートと関連データをすべて削除
    const existingParts = await ctx.db
      .query('parts')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .collect();

    for (const part of existingParts) {
      // 関連する partMemberships を削除
      const memberships = await ctx.db
        .query('partMemberships')
        .withIndex('by_part', (q) => q.eq('partId', part._id))
        .collect();
      for (const membership of memberships) {
        await ctx.db.delete(membership._id);
      }
      // パートを削除
      await ctx.db.delete(part._id);
    }

    // テンプレートから新しいパートを作成
    await Promise.all(
      args.partNames.map((name) =>
        ctx.db.insert('parts', {
          organizationId: args.organizationId,
          name: name,
        }),
      ),
    );
  },
});
