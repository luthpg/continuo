'use client';

import { useMutation, useQuery } from 'convex/react';
import { Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

interface OrganizationMembersSettingsProps {
  organization: Doc<'organizations'>;
}

export function OrganizationMembersSettings({
  organization,
}: OrganizationMembersSettingsProps) {
  const [inviteCode, setInviteCode] = useState(organization.inviteCode);
  const members = useQuery(api.organizations.getMembersByOrganization, {
    organizationId: organization._id,
  });
  const updateMemberRole = useMutation(api.memberships.updateMemberRole);
  const removeMember = useMutation(api.memberships.removeMember);
  const regenerateCode = useMutation(api.organizations.regenerateInviteCode);

  const handleRoleChange = (
    targetUserId: string,
    newRole: 'admin' | 'subAdmin' | 'member',
  ) => {
    toast.promise(
      updateMemberRole({
        organizationId: organization._id,
        targetUserId: targetUserId as Id<'users'>,
        newRole,
      }),
      {
        loading: '役割を変更中...',
        success: '役割を変更しました',
        error: '変更に失敗しました',
      },
    );
  };

  const handleRemoveMember = (targetUserId: string) => {
    toast.promise(
      removeMember({
        organizationId: organization._id,
        targetUserId: targetUserId as Id<'users'>,
      }),
      {
        loading: 'メンバーを削除中...',
        success: 'メンバーを削除しました',
        error: '削除に失敗しました',
      },
    );
  };

  const handleRegenerateCode = async () => {
    const newCode = await regenerateCode({ organizationId: organization._id });
    if (newCode) {
      setInviteCode(newCode);
      toast.success('新しい招待コードを生成しました');
    }
  };

  const handleCopyToClipboard = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    toast.success('招待コードをクリップボードにコピーしました');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>メンバー管理</CardTitle>
        <CardDescription>
          招待コードを使って新しいメンバーを招待したり、既存メンバーの役割を変更したりできます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="invite-code">招待コード</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input id="invite-code" value={inviteCode ?? ''} readOnly />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyToClipboard}
              disabled={!inviteCode}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRegenerateCode}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メンバー</TableHead>
              <TableHead>パート</TableHead>
              <TableHead>役割</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member._id}>
                <TableCell className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.imageUrl ?? undefined} />
                    <AvatarFallback>
                      {(member.displayName ?? member.name).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.displayName ?? member.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{member.part?.name}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <span className="sr-only">メニュー</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(member._id, 'admin')}
                      >
                        管理者に設定
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(member._id, 'subAdmin')}
                      >
                        サブ管理者に設定
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(member._id, 'member')}
                      >
                        メンバーに設定
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
