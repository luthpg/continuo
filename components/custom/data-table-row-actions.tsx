'use client';

import { useMutation } from 'convex/react';
import { MoreHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { TMember } from '@/types/member';

interface DataTableRowActionsProps {
  row: {
    original: TMember;
  };
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('organizationId') as
    | Id<'organizations'>
    | undefined;

  const member = row.original;
  const [currentRole, setCurrentRole] = useState(member.role);

  const updateRole = useMutation(api.memberships.updateMemberRole);
  const removeMember = useMutation(api.memberships.removeMember);

  const handleRoleChange = (newRole: 'admin' | 'subAdmin' | 'member') => {
    if (!organizationId) return;

    setCurrentRole(newRole);
    toast.promise(
      updateRole({
        organizationId,
        targetUserId: member._id,
        newRole,
      }),
      {
        loading: `${member.name}の役割を更新中...`,
        success: '役割を更新しました',
        error: '役割の更新に失敗しました',
      },
    );
  };

  const handleRemoveMember = () => {
    if (!organizationId) return;

    toast.promise(
      removeMember({
        organizationId,
        targetUserId: member._id,
      }),
      {
        loading: `${member.name}を削除中...`,
        success: 'メンバーを削除しました',
        error: 'メンバーの削除に失敗しました',
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuLabel>役割の変更</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currentRole}
          onValueChange={
            handleRoleChange as (value: string) => void | Promise<void>
          }
        >
          <DropdownMenuRadioItem value="admin">管理者</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="subAdmin">
            副管理者
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="member">メンバー</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleRemoveMember} className="text-red-500">
          団体から削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
