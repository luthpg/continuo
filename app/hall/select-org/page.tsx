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
import { useConcertStore } from '@/stores/concert';

type OrganizationWithMemberCount = Doc<'organizations'> & {
  memberCount: number;
};

export default function SelectOrgPage() {
  const router = useRouter();
  const { setActiveOrgId } = useConcertStore();
  const organizations = useQuery(api.organizations.getForUser) as
    | OrganizationWithMemberCount[]
    | undefined;
  const createOrganization = useMutation(api.organizations.create);
  const joinOrganization = useMutation(api.memberships.joinWithInviteCode);
  const [newOrgName, setNewOrgName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const handleSelectOrg = (orgId: string) => {
    setSelectedOrgId(orgId);
  };

  const handleEnterHall = () => {
    if (selectedOrgId) {
      setActiveOrgId(selectedOrgId);
      router.push(`/hall/calendar`);
    }
  };

  const handleJoinOrg = async () => {
    if (!inviteCode) return;
    toast.promise(joinOrganization({ inviteCode }), {
      loading: '団体に参加中...',
      success: (result) => {
        setActiveOrgId(result.organizationId);
        router.push(`/hall/calendar`);
        return '団体に参加しました';
      },
      error: (err: any) => {
        const errorMessage = err.data;
        if (typeof errorMessage === 'string') {
          if (errorMessage.includes('Organization not found')) {
            return '招待コードが無効です。';
          }
          if (errorMessage.includes('already a member')) {
            return 'すでに参加済みの団体です。';
          }
        }
        return '参加に失敗しました';
      },
    });
  };

  const selectedOrg = organizations?.find((org) => org._id === selectedOrgId);

  const handleCreateOrg = async () => {
    if (!newOrgName) return;
    toast.promise(createOrganization({ name: newOrgName }), {
      loading: '団体を作成中...',
      success: (newOrgId) => {
        setActiveOrgId(newOrgId);
        router.push(`/hall/calendar`);
        return '団体を作成しました';
      },
      error: '作成に失敗しました',
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>団体を選択</CardTitle>
            <CardDescription>
              参加している団体を選択してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {organizations && organizations.length > 0 ? (
              <Select onValueChange={handleSelectOrg}>
                <SelectTrigger>
                  <SelectValue placeholder="団体を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations
                    .filter((org): org is OrganizationWithMemberCount => !!org)
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
            {selectedOrg && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">{selectedOrg.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedOrg.description || '説明がありません。'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  メンバー数: {selectedOrg.memberCount}人
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleEnterHall}
              disabled={!selectedOrgId}
              className="w-full"
            >
              ホールへ移動
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>団体に参加</CardTitle>
            <CardDescription>
              招待コードを使って団体に参加します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="invite-code">招待コード</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="招待コードを入力"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleJoinOrg} className="w-full">
              参加
            </Button>
          </CardFooter>
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
