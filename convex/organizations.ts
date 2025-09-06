import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';
import { generateShortId } from './lib/utils';

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

    // ユニークな招待コードを生成
    let inviteCode: string;
    let existingOrg: Doc<'organizations'> | null;
    do {
      inviteCode = generateShortId();
      existingOrg = await ctx.db
        .query('organizations')
        .withIndex('by_invite_code', (q) => q.eq('inviteCode', inviteCode))
        .first();
    } while (existingOrg);

    // 団体を作成
    const organizationId = await ctx.db.insert('organizations', {
      name: args.name,
      ownerId: user._id,
      inviteCode,
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

    const userMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const organizationsWithMemberCount = await Promise.all(
      userMemberships.map(async (membership) => {
        const organization = await ctx.db.get(membership.organizationId);
        if (!organization) {
          return null;
        }

        const orgMemberships = await ctx.db
          .query('memberships')
          .withIndex('by_organization', (q) =>
            q.eq('organizationId', organization._id),
          )
          .collect();

        return {
          ...organization,
          memberCount: orgMemberships.length,
        };
      }),
    );

    return organizationsWithMemberCount.filter(Boolean); // nullを除外
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

export const update = mutation({
  args: {
    id: v.id('organizations'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    practiceLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.id,
      requiredRoles: ['admin'],
    });

    if (!isAuthed) {
      throw new Error('Only admins can update the organization.');
    }

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

// 指定された団体に所属するメンバー一覧を取得するクエリ (パート情報 & 役職情報 JOIN)
export const getMembersByOrganization = query({
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

        const part = partMembership
          ? await ctx.db.get(partMembership.partId)
          : null;

        // 役職情報を取得
        const positionAssignments = await ctx.db
          .query('positionAssignments')
          .withIndex('by_user_org', (q) =>
            q.eq('userId', user._id).eq('organizationId', args.organizationId),
          )
          .collect();

        const positions = await Promise.all(
          positionAssignments.map((a) => ctx.db.get(a.positionId)),
        );

        return {
          _id: user._id,
          clerkId: user.clerkId,
          name: user.name ?? 'No Name',
          email: user.email ?? '',
          imageUrl: user.imageUrl,
          role: membership.role,
          part: part,
          positions: positions.filter((p): p is Doc<'positions'> => p !== null),
        };
      }),
    );

    return members.filter((member) => member !== null);
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
