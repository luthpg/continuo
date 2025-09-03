import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

// 指定された団体IDに紐づく演奏会一覧を取得する
export const getConcertsByOrganization = query({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    // 認証チェック: ユーザーがログインしているか確認
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    const clerkUserId = identity.subject;

    // 認証チェック: ユーザーが団体情報の閲覧権限を持っているか確認
    const isAuthed = await isValidRoleUser(ctx, clerkUserId, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin', 'member'], // メンバーなら誰でも閲覧可能
    });
    if (!isAuthed) {
      throw new Error('Not authorized');
    }

    // データベースからorganizationIdに一致する演奏会をインデックスを使って効率的に検索
    const concerts = await ctx.db
      .query('concerts')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .collect();

    return concerts;
  },
});

// 指定されたIDの演奏会情報を取得する
export const getConcertById = query({
  args: { id: v.id('concerts') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const concert = await ctx.db.get(args.id);
    if (!concert) {
      return null;
    }

    // 認証チェック: ユーザーがこの演奏会を閲覧する権限を持っているか確認
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin', 'member'],
    });

    if (!isAuthed) {
      throw new Error('Not authorized to view this concert');
    }

    return concert;
  },
});

export const create = mutation({
  args: {
    organizationId: v.id('organizations'),
    name: v.string(),
    date: v.optional(v.string()),
    place: v.optional(v.string()),
    openTime: v.optional(v.string()),
    startTime: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });

    if (!isAuthed) {
      throw new Error('Not authorized to create a concert');
    }

    const concertId = await ctx.db.insert('concerts', { ...args });
    return concertId;
  },
});

export const update = mutation({
  args: {
    id: v.id('concerts'),
    name: v.optional(v.string()),
    date: v.optional(v.string()),
    place: v.optional(v.string()),
    openTime: v.optional(v.string()),
    startTime: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const concert = await ctx.db.get(args.id);
    if (!concert) {
      throw new Error('Concert not found');
    }

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });

    if (!isAuthed) {
      throw new Error('Not authorized to update this concert');
    }

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id('concerts') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const concert = await ctx.db.get(args.id);
    if (!concert) {
      throw new Error('Concert not found');
    }

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });

    if (!isAuthed) {
      throw new Error('Not authorized to delete this concert');
    }

    const concertId = args.id;

    // 関連ドキュメントを検索
    const concertMemberships = await ctx.db
      .query('concertMemberships')
      .withIndex('by_concert', (q) => q.eq('concertId', concertId))
      .collect();
    const programs = await ctx.db
      .query('programs')
      .withIndex('by_concert', (q) => q.eq('concertId', concertId))
      .collect();
    const events = await ctx.db
      .query('events')
      .withIndex('by_concert', (q) => q.eq('concertId', concertId))
      .collect();
    const eventTypes = await ctx.db
      .query('eventTypes')
      .withIndex('by_concert', (q) => q.eq('concertId', concertId))
      .collect();
    const assets = await ctx.db
      .query('assets')
      .withIndex('by_concert_asset', (q) => q.eq('concertId', concertId))
      .collect();
    const seatings = await ctx.db
      .query('seatings')
      .withIndex('by_concert_program', (q) => q.eq('concertId', concertId))
      .collect();

    // 間接的に関連するデータを検索
    const programIds = programs.map((p) => p._id);
    const eventIds = events.map((e) => e._id);

    const programMemberships = (
      await Promise.all(
        programIds.map((programId) =>
          ctx.db
            .query('programMemberships')
            .withIndex('by_program', (q) => q.eq('programId', programId))
            .collect(),
        ),
      )
    ).flat();

    const attendances = (
      await Promise.all(
        eventIds.map((eventId) =>
          ctx.db
            .query('attendances')
            .withIndex('by_event', (q) => q.eq('eventId', eventId))
            .collect(),
        ),
      )
    ).flat();

    // アセットに関連するストレージファイルを削除
    for (const asset of assets) {
      await ctx.storage.delete(asset.storageId);
    }

    // すべての関連ドキュメントを並行して削除
    await Promise.all([
      ...concertMemberships.map((doc) => ctx.db.delete(doc._id)),
      ...programs.map((doc) => ctx.db.delete(doc._id)),
      ...events.map((doc) => ctx.db.delete(doc._id)),
      ...eventTypes.map((doc) => ctx.db.delete(doc._id)),
      ...assets.map((doc) => ctx.db.delete(doc._id)),
      ...seatings.map((doc) => ctx.db.delete(doc._id)),
      ...programMemberships.map((doc) => ctx.db.delete(doc._id)),
      ...attendances.map((doc) => ctx.db.delete(doc._id)),
    ]);

    // 最後に演奏会自体を削除
    await ctx.db.delete(concertId);
  },
});
