import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * 指定された演奏会とプログラムの席次情報を取得するクエリ
 * programIdがnullの場合はデフォルトの席次を取得する
 */
export const getSeatingChart = query({
  args: {
    concertId: v.id('concerts'),
    programId: v.union(v.id('programs'), v.null()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      concertId: args.concertId,
      requiredRoles: ['admin', 'subAdmin', 'member'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const seatings = await ctx.db
      .query('seatings')
      .withIndex('by_concert_program', (q) =>
        q.eq('concertId', args.concertId).eq('programId', args.programId),
      )
      .collect();

    // ユーザー情報を付加して返す
    const populatedSeatings = await Promise.all(
      seatings.map(async (seat) => {
        if (seat.userId) {
          const user = await ctx.db.get(seat.userId);
          return { ...seat, user };
        }
        return { ...seat, user: null };
      }),
    );

    return populatedSeatings;
  },
});

/**
 * 奏者を特定の座席に割り当てるミューテーション
 */
export const assignMemberToSeat = mutation({
  args: {
    seatingId: v.id('seatings'),
    userId: v.id('users'),
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

    await ctx.db.patch(args.seatingId, { userId: args.userId });
  },
});

/**
 * 奏者を座席から外すミューテーション
 */
export const unassignMemberFromSeat = mutation({
  args: {
    seatingId: v.id('seatings'),
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

    const seat = await ctx.db.get(args.seatingId);
    if (seat && 'userId' in seat) {
      const { ...rest } = seat;
      await ctx.db.replace(args.seatingId, rest);
    }
  },
});

/**
 * 席次レイアウトを作成・更新するミューテーション
 */
export const createOrUpdateLayout = mutation({
  args: {
    concertId: v.id('concerts'),
    organizationId: v.id('organizations'),
    programId: v.union(v.id('programs'), v.null()),
    layout: v.array(
      v.object({
        partId: v.id('parts'),
        count: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    // 既存のレイアウトを削除
    const existingLayout = await ctx.db
      .query('seatings')
      .withIndex('by_concert_program', (q) =>
        q.eq('concertId', args.concertId).eq('programId', args.programId),
      )
      .collect();
    await Promise.all(existingLayout.map((seat) => ctx.db.delete(seat._id)));

    // 新しいレイアウトを作成
    for (const part of args.layout) {
      for (let i = 1; i <= part.count; i++) {
        // 弦楽器はプルトを想定
        const partDoc = await ctx.db.get(part.partId);
        if (
          partDoc?.name.includes('Violin') ||
          partDoc?.name.includes('Viola') ||
          partDoc?.name.includes('Cello')
        ) {
          await ctx.db.insert('seatings', {
            concertId: args.concertId,
            organizationId: args.organizationId,
            programId: args.programId,
            partId: part.partId,
            type: 'plut',
            number: Math.ceil(i / 2),
            isFrontOfPlut: i % 2 !== 0,
          });
        } else {
          // その他は単一の席
          await ctx.db.insert('seatings', {
            concertId: args.concertId,
            organizationId: args.organizationId,
            programId: args.programId,
            partId: part.partId,
            type: 'part',
            name: `${partDoc?.name} ${i}`,
            number: i,
          });
        }
      }
    }
  },
});

/**
 * 2つの座席の奏者を入れ替えるミューテーション
 */
export const swapSeats = mutation({
  args: {
    seat1Id: v.id('seatings'),
    seat2Id: v.id('seatings'),
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

    const seat1 = await ctx.db.get(args.seat1Id);
    const seat2 = await ctx.db.get(args.seat2Id);

    if (!seat1 || !seat2) {
      throw new Error('One or both seats not found');
    }

    // ユーザーIDを入れ替える
    const user1Id = seat1.userId;
    const user2Id = seat2.userId;

    await ctx.db.patch(args.seat1Id, { userId: user2Id });
    await ctx.db.patch(args.seat2Id, { userId: user1Id });
  },
});
