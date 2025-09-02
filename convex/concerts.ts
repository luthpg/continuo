import { v } from 'convex/values';
import { query } from './_generated/server';
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
