'use client';

import { useMutation } from 'convex/react';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConcertCrudDialog } from '@/components/custom/ConcertCrudDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

interface ConcertCardActionsProps {
  concert: Doc<'concerts'>;
}

export function ConcertCardActions({ concert }: ConcertCardActionsProps) {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const remove = useMutation(api.concerts.remove);

  const handleRemove = () => {
    toast.promise(remove({ id: concert._id }), {
      loading: '演奏会を削除中...',
      success: '演奏会を削除しました',
      error: '削除に失敗しました',
    });
    setIsAlertDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ConcertCrudDialog mode="edit" initialData={concert}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </DropdownMenuItem>
          </ConcertCrudDialog>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsAlertDialogOpen(true)}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              演奏会「{concert.name}
              」を削除します。この操作は元に戻せません。関連するすべてのデータ（プログラム、イベント、出欠記録など）も完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-500 hover:bg-red-600"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
