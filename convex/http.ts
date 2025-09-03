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

    console.log({ eventType: event.type });

    switch (event.type) {
      case 'user.created': {
        const {
          id: clerkUserId,
          email_addresses,
          first_name,
          last_name,
          image_url,
        } = event.data;
        const email = email_addresses[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(' ');

        await ctx.runMutation(internal.users.createConvexUser, {
          clerkUserId,
          email,
          name,
          imageUrl: image_url,
        });
        break;
      }
      case 'user.updated': {
        const {
          id: clerkUserId,
          email_addresses,
          first_name,
          last_name,
          image_url,
        } = event.data;
        const email = email_addresses[0]?.email_address;
        const name = [first_name, last_name].filter(Boolean).join(' ');

        await ctx.runMutation(internal.users.updateUser, {
          clerkUserId,
          email,
          name,
          imageUrl: image_url,
        });
        break;
      }
      case 'user.deleted': {
        const clerkUserId = event.data.id;
        if (!clerkUserId) {
          return new Response('Clerk User ID not found in webhook payload', {
            status: 400,
          });
        }
        await ctx.runMutation(internal.users.deleteUserAndData, {
          clerkUserId,
        });
        break;
      }
    }

    return new Response(null, { status: 200 });
  }),
});

export default http;
