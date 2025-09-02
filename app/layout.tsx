import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import '@/app/globals.css';
import { jaJP } from '@clerk/localizations';
import ConvexClientProvider from '@/components/custom/ConvexClientProvider';
import { ThemeProvider } from '@/components/custom/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'continuo',
  description: 'All utils for your Orchestra support',
  openGraph: {
    type: 'website',
    url: './',
    title: 'continuo',
    description: 'All utils for your Orchestra support',
    siteName: 'continuo',
    images: './icon.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'continuo',
    description: 'All utils for your Orchestra support',
    images: './icon.png',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} ${notoSansJP.className}`}>
        <ConvexClientProvider localization={jaJP}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* ログイン済みの場合のみメインコンテンツを表示 */}
            <SignedIn>{children}</SignedIn>
            {/* 未ログインの場合はトップページ（将来的にはLPなど）を表示 */}
            <SignedOut>
              {/* ここでは仮にサインインボタンを中央に表示 */}
              <div className="flex min-h-screen flex-col items-center justify-center">
                <h1 className="logo-style text-6xl mb-8">Continuo.</h1>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-full bg-blue-500 px-6 py-3 text-white"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </div>
            </SignedOut>
            <Toaster duration={5000} position="bottom-right" richColors />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
