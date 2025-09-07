'use client';

import { v } from 'convex/values';
import dayjs from 'dayjs';
import { mutation, query } from './_generated/server';
import { isValidRoleUser } from './lib/role';

// 指定された演奏会IDに紐づくイベント一覧を取得する
export const getEventsByConcert = query({
  args: {
    concertId: v.id('concerts'),
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

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin', 'member'],
    });

    if (!isAuthed) {
      throw new Error('Not authorized');
    }

    const events = await ctx.db
      .query('events')
      .withIndex('by_concert', (q) => q.eq('concertId', args.concertId))
      .collect();

    return events;
  },
});

export const create = mutation({
  args: {
    concertId: v.id('concerts'),
    title: v.string(),
    startAt: v.string(),
    endAt: v.string(),
    place: v.optional(v.string()),
    description: v.optional(v.string()),
    // Repetition rule
    isRecurring: v.optional(v.boolean()),
    frequency: v.optional(v.union(v.literal('weekly'), v.literal('monthly'))),
    interval: v.optional(v.number()),
    weekdays: v.optional(v.array(v.string())), // "SU", "MO", ...
    until: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const concert = await ctx.db.get(args.concertId);
    if (!concert) throw new Error('Concert not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: concert.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const {
      isRecurring,
      frequency,
      interval,
      weekdays,
      until,
      ...eventCoreData
    } = args;

    if (!isRecurring) {
      // Single event creation
      await ctx.db.insert('events', {
        ...eventCoreData,
        organizationId: concert.organizationId,
      });
    } else {
      // Recurring event creation
      const { startAt, endAt } = eventCoreData;
      if (!frequency || !interval || !until) {
        throw new Error('Incomplete repetition rule');
      }

      const startDate = dayjs(startAt);
      const eventDuration = dayjs(endAt).diff(startDate);
      const untilDate = dayjs(until);
      const weekdayMap: { [key: string]: number } = {
        SU: 0,
        MO: 1,
        TU: 2,
        WE: 3,
        TH: 4,
        FR: 5,
        SA: 6,
      };
      const targetWeekdays = weekdays?.map((d) => weekdayMap[d]);

      const eventsToCreate = [];
      let currentDate = startDate;

      while (
        currentDate.isBefore(untilDate) ||
        currentDate.isSame(untilDate, 'day')
      ) {
        if (frequency === 'weekly') {
          if (targetWeekdays?.includes(currentDate.day())) {
            eventsToCreate.push({
              ...eventCoreData,
              startAt: currentDate.toISOString(),
              endAt: currentDate.add(eventDuration).toISOString(),
              organizationId: concert.organizationId,
            });
          }
          currentDate = currentDate.add(1, 'day');
        } else if (frequency === 'monthly') {
          if (currentDate.date() === startDate.date()) {
            eventsToCreate.push({
              ...eventCoreData,
              startAt: currentDate.toISOString(),
              endAt: currentDate.add(eventDuration).toISOString(),
              organizationId: concert.organizationId,
            });
          }
          currentDate = currentDate.add(1, 'day');
        }
      }

      // Apply interval
      const finalEvents = eventsToCreate.filter((_, index) => {
        if (interval === 1) return true;
        return index % interval === 0;
      });

      await Promise.all(
        finalEvents.map((event) => ctx.db.insert('events', event)),
      );
    }
  },
});

export const update = mutation({
  args: {
    id: v.id('events'),
    title: v.optional(v.string()),
    startAt: v.optional(v.string()),
    endAt: v.optional(v.string()),
    conductor: v.optional(v.string()),
    type: v.optional(v.id('eventTypes')),
    place: v.optional(v.string()),
    description: v.optional(v.string()),
    programs: v.optional(v.array(v.id('programs'))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error('Event not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: event.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id('events') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const event = await ctx.db.get(args.id);
    if (!event) throw new Error('Event not found');

    const isAuthed = await isValidRoleUser(ctx, identity.subject, {
      organizationId: event.organizationId,
      requiredRoles: ['admin', 'subAdmin'],
    });
    if (!isAuthed) throw new Error('Not authorized');

    // 関連する attendances を削除
    const attendances = await ctx.db
      .query('attendances')
      .withIndex('by_event', (q) => q.eq('eventId', args.id))
      .collect();

    for (const attendance of attendances) {
      await ctx.db.delete(attendance._id);
    }

    // イベントを削除
    await ctx.db.delete(args.id);
  },
});
