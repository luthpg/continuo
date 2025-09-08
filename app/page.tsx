'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { useConvexAuth } from 'convex/react';
import { CalendarCheck, FileMusic, Megaphone, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isAuthenticated) {
    return redirect('/hall');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center">
        <div className="container flex h-14 items-center px-3">
          <div className="mr-auto flex items-center">
            <a className="flex items-center space-x-2" href="/">
              <span className="logo-style font-bold sm:inline-block text-2xl">
                Continuo.
              </span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <SignInButton mode="modal">
              <Button variant="ghost">ログイン</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>サインアップ</Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                楽団運営をスマートに。
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                <span className="logo-style mr-2">Continuo.</span>
                は、楽団運営に必要な情報を一元管理し、メンバー間のコミュニケーションを円滑にするためのプラットフォームです。出欠管理、楽譜共有、演奏会情報などを簡単に管理できます。
              </p>
              <div className="space-x-4 pt-6">
                <SignUpButton mode="modal">
                  <Button size="lg">今すぐ始める</Button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section */}
        <section
          id="features"
          className="w-full bg-muted py-12 md:py-24 lg:py-32 flex justify-center"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="inline-block rounded-lg bg-muted-foreground/10 px-3 py-1 text-sm">
                機能紹介
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                楽団の団体運営に特化した
                <br />
                管理プラットフォーム
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Continuoは、楽団運営のあらゆる面倒な作業をシンプルにします。
                メンバーが音楽に集中できる環境を、私たちが提供します。
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="text-center">
                <CardHeader className="items-center pb-4">
                  <CalendarCheck className="h-8 w-8 text-muted-foreground" />
                  <CardTitle className="pt-4 text-lg font-semibold">
                    出欠管理
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    練習やイベントの出欠をオンラインで簡単に提出・確認できます。
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader className="items-center pb-4">
                  <FileMusic className="h-8 w-8 text-muted-foreground" />
                  <CardTitle className="pt-4 text-lg font-semibold">
                    楽譜・音源共有
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    パート譜や参考音源をアップロードし、メンバー全員で共有できます。
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader className="items-center pb-4">
                  <Megaphone className="h-8 w-8 text-muted-foreground" />
                  <CardTitle className="pt-4 text-lg font-semibold">
                    イベント管理
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    演奏会や合宿などのイベント情報を一元管理。詳細はいつでも確認可能。
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader className="items-center pb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <CardTitle className="pt-4 text-lg font-semibold">
                    座席表作成
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    演奏会ごとの座席表をドラッグ＆ドロップで直感的に作成・共有。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="flex flex-col items-center justify-center gap-2 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2025 Continuo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
