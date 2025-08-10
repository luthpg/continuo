import { httpRouter } from 'convex/server';
import { internal } from '@/convex/_generated/api';
import { httpAction } from '@/convex/_generated/server';
import { validateRequest } from '@/convex/lib/utils';

const http = httpRouter();

http.route({
  path: '/api/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response('Could not validate request', { status: 400 });
    }

    if (event.type === 'user.deleted') {
      const clerkUserId = event.data.id;
      if (!clerkUserId) {
        return new Response('Clerk User ID not found in webhook payload', {
          status: 400,
        });
      }
      await ctx.runMutation(internal.users.deleteUserAndData, {
        clerkUserId,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
