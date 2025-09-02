import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * 指定された団体に紐づく全てのパート情報を取得するクエリ
 */
export const getPartsByOrganization = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    // TODO: 権限チェックを追加
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
    // In a real app, you'd want to add authentication checks here
    const partId = await ctx.db.insert('parts', {
      organizationId: args.organizationId,
      name: args.name,
    });
    return partId;
  },
});
