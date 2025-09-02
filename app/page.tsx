'use client';

import { SignInButton } from '@clerk/nextjs';
import { useConvexAuth } from 'convex/react';
import { redirect } from 'next/navigation';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isAuthenticated) {
    return redirect('/hall');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="logo-style text-center text-6xl text-black dark:text-white">
        Continuo.
      </h1>
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-full bg-blue-500 px-6 py-3 text-white"
        >
          Sign in
        </button>
      </SignInButton>
    </div>
  );
}
