'use client';

import { useMutation, useQuery } from 'convex/react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PositionCrudDialog } from '@/components/custom/PositionCrudDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useConcertStore } from '@/stores/concert';

export function PositionManagementDialog() {
  const { activeOrgId } = useConcertStore();
  const positions = useQuery(
    api.positions.getPositionsByOrganization,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );
  const removePosition = useMutation(api.positions.remove);

  const handleRemove = (id: Id<'positions'>) => {
    toast.promise(removePosition({ id }), {
      loading: '役職を削除中...',
      success: '役職を削除しました',
      error: '削除に失敗しました',
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">役職を管理</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>役職管理</DialogTitle>
          <DialogDescription>
            団体の役職を作成、編集、削除します。
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <PositionCrudDialog mode="create" organizationId={activeOrgId!}>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </PositionCrudDialog>
        </div>
        <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>役職名</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions === undefined ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((position) => (
                  <TableRow key={position._id}>
                    <TableCell className="font-medium">
                      {position.name}
                    </TableCell>
                    <TableCell>{position.description ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <PositionCrudDialog
                            mode="edit"
                            organizationId={activeOrgId!}
                            initialData={position}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              編集
                            </DropdownMenuItem>
                          </PositionCrudDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                削除
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  本当に削除しますか？
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  この操作は取り消せません。「{position.name}
                                  」を完全に削除します。関連するメンバーの役職割り当てもすべて解除されます。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  キャンセル
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemove(position._id)}
                                >
                                  削除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
