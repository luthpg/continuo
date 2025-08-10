import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import '@/app/globals.css';
import { jaJP } from '@clerk/localizations';
import ConvexClientProvider from '@/components/custom/ConvexClientProvider';
import { ThemeProvider } from '@/components/custom/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import type { Id } from '@/convex/_generated/dataModel';

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
            organizationId={'test' as Id<'organizations'>}
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster duration={10000} position="bottom-right" richColors />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
