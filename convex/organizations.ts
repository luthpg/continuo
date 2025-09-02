import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * 新しい団体を作成するミューテーション
 * 作成者は自動的に管理者になる
 */
export const create = mutation({
  args: {
    name: v.string(),
  },
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

    // 団体を作成
    const organizationId = await ctx.db.insert('organizations', {
      name: args.name,
      ownerId: user._id,
    });

    // 作成者を管理者としてメンバーシップに追加
    await ctx.db.insert('memberships', {
      userId: user._id,
      organizationId,
      role: 'admin',
    });

    return organizationId;
  },
});

/**
 * ログインユーザーが所属する団体の一覧を取得するクエリ
 */
export const getForUser = query({
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

    const organizations = await Promise.all(
      memberships.map((m) => ctx.db.get(m.organizationId)),
    );

    return organizations.filter(Boolean); // nullを除外
  },
});

// 団体情報を取得
export const get = query({
  args: {
    id: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    if (!args.id) {
      return null;
    }
    const identity = await ctx.auth.getUserIdentity();
    const clerkUserId = identity?.subject;

    const isAuthed = await isValidRoleUser(ctx, clerkUserId, {
      organizationId: args.id,
    });
    if (!isAuthed) {
      return null;
    }

    const organization = await ctx.db.get(args.id);
    return organization;
  },
});

// Clerkのorganization IDを基にConvexのorganization情報を取得
export const getOrganizationByClerkId = query({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    // Clerk IDはorganizationsテーブルの_idとして保存されていると仮定
    const organization = await ctx.db
      .query('organizations')
      .filter((q) => q.eq(q.field('_id'), args.clerkOrgId))
      .first();
    return organization;
  },
});

// 指定された団体に所属するメンバー一覧を取得するクエリ (パート情報JOIN)
export const getMembersByOrganization = query({
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

    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        // パート情報を取得
        const partMembership = await ctx.db
          .query('partMemberships')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .first();

        let partName = '未設定';
        let partId = null;
        if (partMembership) {
          const partDoc = await ctx.db.get(partMembership.partId);
          if (partDoc) {
            partName = partDoc.name;
            partId = partDoc._id;
          }
        }

        return {
          _id: user._id,
          name: user.name ?? 'No Name',
          email: user.email ?? '',
          imageUrl: user.imageUrl,
          role: membership.role,
          part: partName,
          partId: partId,
        };
      }),
    );

    return members.filter(
      (
        member,
      ): member is {
        _id: Id<'users'>;
        name: string;
        email: string;
        imageUrl: string;
        role: 'admin' | 'subAdmin' | 'member';
        part: string;
        partId: Id<'parts'> | null;
      } => member !== null,
    );
  },
});

/**
 * 団体のテーマカラーを更新するミューテーション
 */
export const updateThemeColor = mutation({
  args: {
    organizationId: v.id('organizations'),
    themeColor: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 権限チェック：管理者のみがテーマカラーを変更可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin'],
    });
    if (!isAuthed) {
      throw new Error('Only admins can change the theme color.');
    }

    await ctx.db.patch(args.organizationId, { themeColor: args.themeColor });
  },
});
