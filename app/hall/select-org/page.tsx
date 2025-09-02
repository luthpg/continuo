'use client';

import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

export default function SelectOrgPage() {
  const router = useRouter();
  const organizations = useQuery(api.organizations.getForUser);
  const createOrganization = useMutation(api.organizations.create);
  const [newOrgName, setNewOrgName] = useState('');

  const handleSelectOrg = (orgId: string) => {
    if (orgId) {
      router.push(`/hall/calendar?organizationId=${orgId}`);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName) return;
    toast.promise(createOrganization({ name: newOrgName }), {
      loading: '団体を作成中...',
      success: (newOrgId) => {
        router.push(`/hall/calendar?organizationId=${newOrgId}`);
        return '団体を作成しました';
      },
      error: '作成に失敗しました',
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>団体を選択</CardTitle>
            <CardDescription>
              参加している団体を選択してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organizations && organizations.length > 0 ? (
              <Select onValueChange={handleSelectOrg}>
                <SelectTrigger>
                  <SelectValue placeholder="団体を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations
                    .filter((org): org is Doc<'organizations'> => !!org)
                    .map((org) => (
                      <SelectItem key={org._id} value={org._id}>
                        {org.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                参加している団体はありません。
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>新しい団体を作成</CardTitle>
            <CardDescription>
              新しいオーケストラ団体を登録します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="new-org-name">団体名</Label>
            <Input
              id="new-org-name"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="例: Continuo交響楽団"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateOrg} className="w-full">
              作成
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
