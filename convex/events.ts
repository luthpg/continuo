import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// 指定された演奏会IDに紐づくイベント一覧を取得する
export const getByConcert = query({
  // フロントエンドから受け取る引数の型を定義
  args: {
    concertId: v.id('concerts'),
  },
  handler: async (ctx, args) => {
    // 認証チェック: ユーザーがログインしているか確認
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // データベースからconcertIdに一致するイベントをインデックスを使って効率的に検索
    const events = await ctx.db
      .query('events')
      .withIndex('by_concert', (q) => q.eq('concertId', args.concertId))
      .collect();

    return events;
  },
});

// 新しいイベントを作成する
export const create = mutation({
  args: {
    concertId: v.id('concerts'),
    organizationId: v.id('organizations'),
    title: v.string(),
    startAt: v.string(),
    endAt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // TODO: 本来は、このユーザーがこの団体(organizationId)の
    // イベントを作成する権限（例：adminロール）を持っているか、
    // membershipsテーブルをチェックするロジックをここに追加します。

    // 新しいイベントをデータベースに挿入
    const eventId = await ctx.db.insert('events', {
      concertId: args.concertId,
      organizationId: args.organizationId,
      title: args.title,
      startAt: args.startAt,
      endAt: args.endAt,
    });

    return eventId;
  },
});
