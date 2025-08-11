import type { Id } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';

export async function isValidRoleUser(
  ctx: QueryCtx,
  clerkUserId: string | undefined,
  {
    requiredRoles,
    concertId,
    organizationId,
  }: {
    requiredRoles?: Array<string>;
    concertId?: Id<'concerts'>;
    organizationId?: Id<'organizations'>;
  } = {},
): Promise<boolean> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) =>
      q.eq('clerkId', clerkUserId ?? '---blank-text---'),
    )
    .first();

  if (!user) {
    // ユーザーがConvexに存在しない場合エラー
    console.error('User not found');
    return false;
  }

  // organization role check
  if (organizationId) {
    const membership = await ctx.db
      .query('memberships')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', user._id).eq('organizationId', organizationId),
      )
      .first();

    if (
      !membership ||
      requiredRoles == null ||
      !requiredRoles.includes(membership.role)
    ) {
      console.error('Not authorized');
      return false;
    }
  }

  // concert role check
  if (concertId) {
    const membership = await ctx.db
      .query('concertMemberships')
      .withIndex('by_user_concert', (q) =>
        q.eq('userId', user._id).eq('concertId', concertId),
      )
      .first();

    if (
      !membership ||
      requiredRoles == null ||
      !requiredRoles.includes(membership.role)
    ) {
      console.error('Not authorized');
      return false;
    }
  }

  return true;
}
