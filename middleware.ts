import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// isProtectedRouteは、保護対象のルートを判定する関数です
const isProtectedRoute = createRouteMatcher(['/hall(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // isProtectedRouteに一致するルートの場合は、認証を要求します
  if (isProtectedRoute(req)) {
    (await auth()).protect();
  }
});

export const config = {
  // middlewareを適用するルートを指定します
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
