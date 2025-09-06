import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

// Get positions by organization
export const getPositionsByOrganization = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin', 'member'],
    });
    if (!isAuthed) {
      throw new Error('Not authorized');
    }
    return await ctx.db
      .query('positions')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .order('asc')
      .collect();
  },
});

// Create a new position
export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    return await ctx.db.insert('positions', {
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
    });
  },
});

// Update a position
export const update = mutation({
  args: {
    id: v.id('positions'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const position = await ctx.db.get(args.id);
    if (!position) throw new Error('Position not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: position.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

// Remove a position
export const remove = mutation({
  args: { id: v.id('positions') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const position = await ctx.db.get(args.id);
    if (!position) throw new Error('Position not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: position.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    // Also remove related assignments
    const assignments = await ctx.db
      .query('positionAssignments')
      .withIndex('by_position', (q) => q.eq('positionId', args.id))
      .collect();

    for (const assignment of assignments) {
      await ctx.db.delete(assignment._id);
    }

    await ctx.db.delete(args.id);
  },
});
