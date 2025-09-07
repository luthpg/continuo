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

/**
 * 招待コードを再生成するミューテーション
 */
export const regenerateInviteCode = mutation({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 権限チェック：管理者のみが招待コードを再生成可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin'],
    });
    if (!isAuthed) {
      throw new Error('Only admins can regenerate the invite code.');
    }

    // ユニークな新しい招待コードを生成
    let newInviteCode: string;
    let existingOrg: Doc<'organizations'> | null;
    do {
      newInviteCode = generateShortId();
      existingOrg = await ctx.db
        .query('organizations')
        .withIndex('by_invite_code', (q) => q.eq('inviteCode', newInviteCode))
        .first();
    } while (existingOrg);

    await ctx.db.patch(args.organizationId, { inviteCode: newInviteCode });

    return newInviteCode;
  },
});

/**
 * 団体を削除するミューテーション
 * 関連するすべてのデータも削除される
 */
export const deleteOrganization = mutation({
  args: {
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 権限チェック：オーナーのみが団体を削除可能
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user || user._id !== organization.ownerId) {
      throw new Error('Only the owner can delete the organization.');
    }

    const orgId = args.organizationId;

    // 1. Concerts and their related data
    const concerts = await ctx.db
      .query('concerts')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId))
      .collect();

    for (const concert of concerts) {
      const concertId = concert._id;
      // concertMemberships
      const concertMemberships = await ctx.db
        .query('concertMemberships')
        .withIndex('by_concert', (q) => q.eq('concertId', concertId))
        .collect();
      await Promise.all(concertMemberships.map((m) => ctx.db.delete(m._id)));
      // programs
      const programs = await ctx.db
        .query('programs')
        .withIndex('by_concert', (q) => q.eq('concertId', concertId))
        .collect();
      await Promise.all(programs.map((p) => ctx.db.delete(p._id)));
      // events and attendances
      const events = await ctx.db
        .query('events')
        .withIndex('by_concert', (q) => q.eq('concertId', concertId))
        .collect();
      for (const event of events) {
        const attendances = await ctx.db
          .query('attendances')
          .withIndex('by_event', (q) => q.eq('eventId', event._id))
          .collect();
        await Promise.all(attendances.map((a) => ctx.db.delete(a._id)));
        await ctx.db.delete(event._id);
      }
      // assets
      const assets = await ctx.db
        .query('assets')
        .withIndex('by_concert_asset', (q) => q.eq('concertId', concertId))
        .collect();
      for (const asset of assets) {
        await ctx.storage.delete(asset.storageId);
        await ctx.db.delete(asset._id);
      }
      // seatings
      const seatings = await ctx.db
        .query('seatings')
        .withIndex('by_concert_program', (q) => q.eq('concertId', concertId))
        .collect();
      await Promise.all(seatings.map((s) => ctx.db.delete(s._id)));
      // concert 本体
      await ctx.db.delete(concertId);
    }

    // 2. Parts and their memberships
    const parts = await ctx.db
      .query('parts')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId))
      .collect();
    for (const part of parts) {
      const partMemberships = await ctx.db
        .query('partMemberships')
        .withIndex('by_part', (q) => q.eq('partId', part._id))
        .collect();
      await Promise.all(partMemberships.map((pm) => ctx.db.delete(pm._id)));
      await ctx.db.delete(part._id);
    }

    // 3. Positions and their assignments
    const positions = await ctx.db
      .query('positions')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId))
      .collect();
    for (const position of positions) {
      const positionAssignments = await ctx.db
        .query('positionAssignments')
        .withIndex('by_position', (q) => q.eq('positionId', position._id))
        .collect();
      await Promise.all(positionAssignments.map((pa) => ctx.db.delete(pa._id)));
      await ctx.db.delete(position._id);
    }

    // 4. Memberships
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId))
      .collect();
    await Promise.all(memberships.map((m) => ctx.db.delete(m._id)));

    // 5. Organization 本体
    await ctx.db.delete(orgId);
  },
});
