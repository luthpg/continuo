import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * 指定されたプログラムのパート編成設定を取得するクエリ
 */
export const getPartSettings = query({
  args: {
    programId: v.id('programs'),
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) {
      throw new Error('Program not found');
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: program.organizationId,
      requiredRoles: ['admin', 'subAdmin', 'member'],
    });
    if (!isAuthed) {
      throw new Error('Not authorized');
    }

    return await ctx.db
      .query('programParts')
      .withIndex('by_program', (q) => q.eq('programId', args.programId))
      .collect();
  },
});

/**
 * パート編成設定を更新するミューテーション
 */
export const updatePartSettings = mutation({
  args: {
    programId: v.id('programs'),
    organizationId: v.id('organizations'),
    settings: v.array(
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

    // 既存の設定を一度すべて削除
    const existingSettings = await ctx.db
      .query('programParts')
      .withIndex('by_program', (q) => q.eq('programId', args.programId))
      .collect();

    await Promise.all(existingSettings.map((s) => ctx.db.delete(s._id)));

    // 新しい設定を挿入
    await Promise.all(
      args.settings.map((setting) => {
        if (setting.count > 0) {
          return ctx.db.insert('programParts', {
            programId: args.programId,
            partId: setting.partId,
            count: setting.count,
            organizationId: args.organizationId,
          });
        }
        return Promise.resolve();
      }),
    );
  },
});
