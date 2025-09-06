'use client';

import { useMutation, useQuery } from 'convex/react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PartCrudDialog } from '@/components/custom/PartCrudDialog';
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

export function PartManagementDialog() {
  const { activeOrgId } = useConcertStore();
  const parts = useQuery(
    api.parts.getPartsByOrganization,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );
  const removePart = useMutation(api.parts.remove);

  const handleRemove = (id: Id<'parts'>) => {
    toast.promise(removePart({ id }), {
      loading: 'パートを削除中...',
      success: 'パートを削除しました',
      error: '削除に失敗しました',
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">パートを管理</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>パート管理</DialogTitle>
          <DialogDescription>
            団体のパートを作成、編集、削除します。
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <PartCrudDialog mode="create" organizationId={activeOrgId!}>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </PartCrudDialog>
        </div>
        <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>パート名</TableHead>
                <TableHead>最大人数</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts === undefined ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                parts.map((part) => (
                  <TableRow key={part._id}>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>{part.maxCounts ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <PartCrudDialog
                            mode="edit"
                            organizationId={activeOrgId!}
                            initialData={part}
                          >
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              編集
                            </DropdownMenuItem>
                          </PartCrudDialog>
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
                                  この操作は取り消せません。「{part.name}
                                  」を完全に削除します。関連するメンバーのパート設定は解除されます。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  キャンセル
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemove(part._id)}
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
