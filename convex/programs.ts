import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * 指定された演奏会に紐づく全てのプログラム（曲目）を取得するクエリ
 */
export const getProgramsByConcert = query({
  args: {
    concertId: v.id('concerts'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const concert = await ctx.db.get(args.concertId);
    if (!concert) {
      throw new Error('Concert not found');
    }

    // 権限チェック：所属メンバーなら誰でも閲覧可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin', 'member'],
    });

    if (!isAuthed) {
      throw new Error('Not authorized');
    }

    return await ctx.db
      .query('programs')
      .withIndex('by_concert', (q) => q.eq('concertId', args.concertId))
      .order('asc')
      .collect();
  },
});

export const create = mutation({
  args: {
    concertId: v.id('concerts'),
    name: v.string(),
    description: v.optional(v.string()),
    orderName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const concert = await ctx.db.get(args.concertId);
    if (!concert) throw new Error('Concert not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const existingPrograms = await ctx.db
      .query('programs')
      .withIndex('by_concert', (q) => q.eq('concertId', args.concertId))
      .collect();

    const maxOrderIndex = Math.max(
      0,
      ...existingPrograms.map((p) => p.orderIndex),
    );

    const programId = await ctx.db.insert('programs', {
      organizationId: concert.organizationId,
      concertId: args.concertId,
      name: args.name,
      description: args.description,
      orderName: args.orderName,
      orderIndex: maxOrderIndex + 1,
    });

    return programId;
  },
});

export const update = mutation({
  args: {
    id: v.id('programs'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    orderName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const program = await ctx.db.get(args.id);
    if (!program) throw new Error('Program not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: program.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id('programs') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const program = await ctx.db.get(args.id);
    if (!program) throw new Error('Program not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: program.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    // 関連データを削除
    const seatings = await ctx.db
      .query('seatings')
      .withIndex('by_concert_program', (q) =>
        q.eq('concertId', program.concertId).eq('programId', program._id),
      )
      .collect();

    for (const seating of seatings) {
      await ctx.db.delete(seating._id);
    }

    const programMemberships = await ctx.db
      .query('programMemberships')
      .withIndex('by_program', (q) => q.eq('programId', program._id))
      .collect();

    for (const pm of programMemberships) {
      await ctx.db.delete(pm._id);
    }

    await ctx.db.delete(args.id);
  },
});
