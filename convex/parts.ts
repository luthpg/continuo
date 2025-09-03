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

export const createPart = mutation({
  args: {
    organizationId: v.id('organizations'),
    name: v.string(),
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
    });
    return partId;
  },
});
