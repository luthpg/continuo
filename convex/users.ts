import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
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

    // const bookmarks = await ctx.db
    //   .query('bookmarks')
    //   .withIndex('by_userId', (q) => q.eq('userId', convexUserId))
    //   .collect();
    // await Promise.all(bookmarks.map((bookmark) => ctx.db.delete(bookmark._id)));

    // const apiKeys = await ctx.db
    //   .query('apiKeys')
    //   .withIndex('by_userId', (q) => q.eq('userId', convexUserId))
    //   .collect();
    // await Promise.all(apiKeys.map((key) => ctx.db.delete(key._id)));

    await ctx.db.delete(convexUserId);

    console.log(
      `Successfully deleted user ${convexUserId} and all associated data.`,
    );
  },
});
