import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

// Get assigned positions for a user in an organization
export const getAssignedPositions = query({
  args: {
    userId: v.id('users'),
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

    const assignments = await ctx.db
      .query('positionAssignments')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', args.userId).eq('organizationId', args.organizationId),
      )
      .collect();

    const positions = await Promise.all(
      assignments.map((a) => ctx.db.get(a.positionId)),
    );

    return positions.filter((p) => p !== null);
  },
});

// Assign a position to a user
export const assignPosition = mutation({
  args: {
    userId: v.id('users'),
    positionId: v.id('positions'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    // Check if assignment already exists
    const existingAssignment = await ctx.db
      .query('positionAssignments')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', args.userId).eq('organizationId', args.organizationId),
      )
      .filter((q) => q.eq(q.field('positionId'), args.positionId))
      .first();

    if (existingAssignment) {
      return; // Already assigned
    }

    await ctx.db.insert('positionAssignments', {
      userId: args.userId,
      positionId: args.positionId,
      organizationId: args.organizationId,
    });
  },
});

// Unassign a position from a user
export const unassignPosition = mutation({
  args: {
    userId: v.id('users'),
    positionId: v.id('positions'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const assignment = await ctx.db
      .query('positionAssignments')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', args.userId).eq('organizationId', args.organizationId),
      )
      .filter((q) => q.eq(q.field('positionId'), args.positionId))
      .first();

    if (assignment) {
      await ctx.db.delete(assignment._id);
    }
  },
});
