'use client';

import { useMutation, useQuery } from 'convex/react';
import { MoreHorizontal } from 'lucide-react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { AddConcertMemberDialog } from '@/components/custom/AddConcertMemberDialog';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { ProgramCrudDialog } from '@/components/custom/ProgramCrudDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export default function ConcertDetailPage() {
  const { concertId } = useParams<{ concertId: Id<'concerts'> }>();
  const concertDetails = useQuery(api.concerts.getDetails, { id: concertId });
  const orgMembers = useQuery(
    api.organizations.getMembersByOrganization,
    concertDetails ? { organizationId: concertDetails.organizationId } : 'skip',
  );
  const currentUserRole = useQuery(
    api.users.getCurrentUserRole,
    concertDetails ? { organizationId: concertDetails.organizationId } : 'skip',
  );

  const updateConcert = useMutation(api.concerts.update);
  const updateRole = useMutation(api.concertMemberships.updateRole);
  const removeMember = useMutation(api.concertMemberships.removeMember);

  const handleStatusChange = (
    status: 'planning' | 'recruiting' | 'finished',
  ) => {
    toast.promise(updateConcert({ id: concertId, status }), {
      loading: 'ステータスを更新中...',
      success: 'ステータスを更新しました',
      error: '更新に失敗しました',
    });
  };

  const handleRoleChange = (
    id: Id<'concertMemberships'>,
    role: 'admin' | 'leader' | 'member',
  ) => {
    toast.promise(updateRole({ concertMembershipId: id, role }), {
      loading: '役割を変更中...',
      success: '役割を変更しました',
      error: '変更に失敗しました',
    });
  };

  const handleRemoveMember = (id: Id<'concertMemberships'>) => {
    toast.promise(removeMember({ concertMembershipId: id }), {
      loading: 'メンバーを削除中...',
      success: 'メンバーを削除しました',
      error: '削除に失敗しました',
    });
  };

  if (concertDetails === undefined || orgMembers === undefined) {
    return <FullPageSpinner />;
  }

  if (concertDetails === null) {
    return <div>演奏会が見つかりません。</div>;
  }

  const { name, date, place, description, programs, members } = concertDetails;

  // 参加していないメンバーを計算
  const unassignedMembers = orgMembers
    ? orgMembers.filter(
        (orgMember) =>
          !members.some(
            (concertMember) => concertMember?._id === orgMember._id,
          ),
      )
    : [];

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'subAdmin';

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{name}</h1>
          <Badge
            variant={
              concertDetails.status === 'finished'
                ? 'secondary'
                : concertDetails.status === 'recruiting'
                  ? 'default'
                  : 'outline'
            }
          >
            {concertDetails.status === 'planning'
              ? '企画中'
              : concertDetails.status === 'recruiting'
                ? '募集中'
                : concertDetails.status === 'finished'
                  ? '終了'
                  : '未設定'}
          </Badge>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">ステータス変更</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => handleStatusChange('planning')}>
                企画中にする
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => handleStatusChange('recruiting')}
              >
                募集中にする
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleStatusChange('finished')}>
                終了にする
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>演奏会情報</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{description || '詳細な説明はありません。'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>プログラム</CardTitle>
              <ProgramCrudDialog mode="create" concertId={concertId}>
                <Button variant="outline" size="sm">
                  追加
                </Button>
              </ProgramCrudDialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>曲順</TableHead>
                    <TableHead>曲名</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program._id}>
                      <TableCell>
                        {program.orderName || program.orderIndex}
                      </TableCell>
                      <TableCell>{program.name}</TableCell>
                      <TableCell className="text-right">
                        <ProgramCrudDialog
                          mode="edit"
                          concertId={concertId}
                          initialData={program}
                        >
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </ProgramCrudDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>参加メンバー</CardTitle>
                <CardDescription>{members.length}人</CardDescription>
              </div>
              <AddConcertMemberDialog
                concertId={concertId}
                unassignedMembers={unassignedMembers}
              >
                <Button variant="outline" size="sm">
                  メンバーを追加
                </Button>
              </AddConcertMemberDialog>
            </CardHeader>
            <CardContent className="grid gap-4">
              {members.map((member) => (
                <div
                  key={member.concertMembershipId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.imageUrl ?? undefined} />
                      <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.concertRole}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {member.concertRole !== 'leader' && (
                        <DropdownMenuItem
                          onSelect={() =>
                            handleRoleChange(
                              member.concertMembershipId,
                              'leader',
                            )
                          }
                        >
                          リーダーにする
                        </DropdownMenuItem>
                      )}
                      {member.concertRole !== 'member' && (
                        <DropdownMenuItem
                          onSelect={() =>
                            handleRoleChange(
                              member.concertMembershipId,
                              'member',
                            )
                          }
                        >
                          メンバーにする
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onSelect={() =>
                          handleRemoveMember(member.concertMembershipId)
                        }
                        className="text-destructive"
                      >
                        参加を取り消す
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
