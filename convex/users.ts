import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';

/**
 * 現在認証されているユーザーのConvexユーザー情報を取得するクエリ。
 * ClerkのuserIdを基にConvexのユーザーを検索または作成します。
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const clerkUserId = identity.subject;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
      .first();

    if (!user) {
      return null;
    }

    return user;
  },
});

/**
 * 内部ミューテーション: 新しいConvexユーザーを作成する。
 * `getCurrentUser` クエリからユーザーが存在しない場合に呼び出される。
 */
export const createConvexUser = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { clerkUserId, email, name, imageUrl },
  ): Promise<Id<'users'>> => {
    const userId = await ctx.db.insert('users', {
      clerkId: clerkUserId,
      email: email,
      name: name,
      imageUrl: imageUrl,
    });
    return userId;
  },
});

/**
 * ユーザー情報の更新クエリ (例: 名前やプロフィール画像など、ClerkにないカスタムデータをConvexに保存する場合)
 */
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, imageUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('認証されていません。');
    }
    const clerkUserId = identity.subject;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
      .first();

    if (!user) {
      throw new Error('ユーザーが見つかりませんでした。');
    }

    await ctx.db.patch(user._id, {
      name: name,
      email: email,
      imageUrl: imageUrl,
    });
  },
});

export const updateUser = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { clerkUserId, email, name, imageUrl }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
      .first();

    if (!user) {
      throw new Error('ユーザーが見つかりませんでした。');
    }

    await ctx.db.patch(user._id, {
      name: name,
      email: email,
      imageUrl: imageUrl,
    });
  },
});

export const deleteUserAndData = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
      .first();

    if (!user) {
      console.warn(`User with Clerk ID ${clerkUserId} not found for deletion.`);
      return;
    }

    const convexUserId = user._id;

    // ユーザーに関連するデータを削除 (例)
    // const bookmarks = await ctx.db
    //   .query('bookmarks')
    //   .withIndex('by_userId', (q) => q.eq('userId', convexUserId))
    //   .collect();
    // await Promise.all(bookmarks.map((bookmark) => ctx.db.delete(bookmark._id)));

    await ctx.db.delete(convexUserId);

    console.log(
      `Successfully deleted user ${convexUserId} and all associated data.`,
    );
  },
});

/**
 * ログインユーザーが所属する団体の一覧を取得するクエリ
 */
export const getUserMemberships = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    return memberships;
  },
});

/**
 * 指定された演奏会に所属するメンバーの一覧を取得するクエリ
 */
export const getMembersByConcert = query({
  args: { concertId: v.id('concerts') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) {
      throw new Error('User not found');
    }

    const concert = await ctx.db.get(args.concertId);
    if (!concert) {
      throw new Error('Concert not found');
    }

    // 1. 団体管理者 (admin/subAdmin) かどうかチェック
    const orgMembership = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', user._id).eq('organizationId', concert.organizationId),
      )
      .first();

    const isOrgAdmin =
      orgMembership && ['admin', 'subAdmin'].includes(orgMembership.role);

    // 2. 演奏会のメンバーかどうかチェック
    const concertMembership = await ctx.db
      .query('concertMemberships')
      .withIndex('by_user_concert', (q) =>
        q.eq('userId', user._id).eq('concertId', args.concertId),
      )
      .first();

    const isConcertMember = !!concertMembership;

    // 団体管理者でも演奏会メンバーでもない場合はエラー
    if (!isOrgAdmin && !isConcertMember) {
      throw new Error('Not authorized');
    }

    const concertMemberships = await ctx.db
      .query('concertMemberships')
      .withIndex('by_concert', (q) => q.eq('concertId', args.concertId))
      .collect();

    const userIds = concertMemberships.map((m) => m.userId);

    const users = await Promise.all(
      userIds.map((userId) => ctx.db.get(userId)),
    );

    const members = await Promise.all(
      users
        .filter((user): user is Doc<'users'> => user !== null)
        .map(async (user) => {
          // パート情報を取得
          const partMembership = await ctx.db
            .query('partMemberships')
            .withIndex('by_user', (q) => q.eq('userId', user._id))
            .first();

          let partName = '未設定';
          if (partMembership) {
            const part = await ctx.db.get(partMembership.partId);
            if (part) {
              partName = part.name;
            }
          }

          return {
            _id: user._id,
            name: user.name ?? 'No Name',
            email: user.email ?? '',
            imageUrl: user.imageUrl ?? '',
            part: partName,
          };
        }),
    );

    return members;
  },
});
