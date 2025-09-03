'use client';

import { useMutation } from 'convex/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ConcertForm } from '@/components/custom/ConcertForm';
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
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { useConcertStore } from '@/stores/concert';

const concertFormSchema = z.object({
  name: z.string().min(2, {
    message: '演奏会名は2文字以上で入力してください。',
  }),
  date: z.string().optional(),
  place: z.string().optional(),
  openTime: z.string().optional(),
  startTime: z.string().optional(),
  description: z.string().optional(),
});

type ConcertFormValues = z.infer<typeof concertFormSchema>;

interface ConcertCrudDialogProps {
  mode: 'create' | 'edit';
  initialData?: Doc<'concerts'>;
  children: React.ReactNode;
}

export function ConcertCrudDialog({
  mode,
  initialData,
  children,
}: ConcertCrudDialogProps) {
  const { activeOrgId } = useConcertStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createConcert = useMutation(api.concerts.create);
  const updateConcert = useMutation(api.concerts.update);
  const removeConcert = useMutation(api.concerts.remove);

  const handleSubmit = async (values: ConcertFormValues) => {
    if (!activeOrgId) return;
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        await createConcert({ organizationId: activeOrgId, ...values });
        toast.success('演奏会を作成しました');
      } else if (initialData) {
        await updateConcert({ id: initialData._id, ...values });
        toast.success('演奏会を更新しました');
      }
      setIsOpen(false);
    } catch (_error) {
      toast.error('操作に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    setIsSubmitting(true);

    try {
      await removeConcert({ id: initialData._id });
      toast.success('演奏会を削除しました');
      setIsOpen(false);
    } catch (_error) {
      toast.error('削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新しい演奏会を作成' : '演奏会を編集'}
          </DialogTitle>
          <DialogDescription>
            演奏会の詳細を入力してください。
          </DialogDescription>
        </DialogHeader>
        <ConcertForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
        {mode === 'edit' && (
          <div className="mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">削除</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消せません。「{initialData?.name}
                    」を完全に削除します。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    削除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
