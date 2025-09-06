import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

/**
 * ファイルアップロード用のURLを生成するミューテーション
 * @returns {string} アップロード先のURL
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * 新しいアセット情報をデータベースに保存するミューテーション
 */
export const createAsset = mutation({
  args: {
    storageId: v.id('_storage'),
    name: v.string(),
    type: v.union(
      v.literal('score'),
      v.literal('recording'),
      v.literal('photo'),
      v.literal('text'),
      v.literal('other'),
    ),
    concertId: v.id('concerts'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // 権限チェック：管理者または副管理者のみアップロード可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: args.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) {
      throw new Error('Not authorized to upload assets.');
    }

    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new Error('Could not get file URL.');
    }

    // データベースにアセット情報を保存
    await ctx.db.insert('assets', {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      concertId: args.concertId,
      organizationId: args.organizationId,
      fileUrl: fileUrl,
    });
  },
});

/**
 * 指定された演奏会に紐づくアセットの一覧を取得するクエリ
 */
export const getAssetsByConcert = query({
  args: {
    concertId: v.id('concerts'),
    search: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('score'),
        v.literal('recording'),
        v.literal('photo'),
        v.literal('text'),
        v.literal('other'),
      ),
    ),
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
      throw new Error('Not authorized to view assets.');
    }

    const assets = await ctx.db
      .query('assets')
      .withIndex('by_concert_asset', (q) => q.eq('concertId', args.concertId))
      .order('desc') // 新しいものが上にくるように降順でソート
      .collect();

    let filteredAssets = assets;

    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      filteredAssets = filteredAssets.filter((asset) =>
        asset.name.toLowerCase().includes(searchTerm),
      );
    }

    if (args.type) {
      filteredAssets = filteredAssets.filter(
        (asset) => asset.type === args.type,
      );
    }

    return filteredAssets;
  },
});

/**
 * アセット情報を更新するミューテーション
 */
export const updateAsset = mutation({
  args: {
    assetId: v.id('assets'),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('score'),
        v.literal('recording'),
        v.literal('photo'),
        v.literal('text'),
        v.literal('other'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // 権限チェック：管理者または副管理者のみ更新可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: asset.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) {
      throw new Error('Not authorized to update assets.');
    }

    const { assetId, ...rest } = args;
    await ctx.db.patch(assetId, rest);
  },
});

/**
 * 指定されたアセットを削除するミューテーション
 */
export const deleteAsset = mutation({
  args: { assetId: v.id('assets') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // 権限チェック：管理者または副管理者のみ削除可能
    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: asset.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) {
      throw new Error('Not authorized to delete assets.');
    }

    // ストレージからファイルを削除
    await ctx.storage.delete(asset.storageId);
    // データベースからドキュメントを削除
    await ctx.db.delete(args.assetId);
  },
});
