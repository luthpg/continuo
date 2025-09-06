'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const programFormSchema = z.object({
  name: z.string().min(1, { message: '曲名は必須です。' }),
  description: z.string().optional(),
  orderName: z.string().optional(),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

interface ProgramCrudDialogProps {
  mode: 'create' | 'edit';
  concertId: Id<'concerts'>;
  initialData?: Doc<'programs'>;
  children: React.ReactNode;
}

export function ProgramCrudDialog({
  mode,
  concertId,
  initialData,
  children,
}: ProgramCrudDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const createProgram = useMutation(api.programs.create);
  const updateProgram = useMutation(api.programs.update);
  const removeProgram = useMutation(api.programs.remove);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      orderName: initialData?.orderName || '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = async (values: ProgramFormValues) => {
    try {
      if (mode === 'create') {
        await createProgram({ concertId, ...values });
        toast.success('プログラムを作成しました');
      } else if (initialData) {
        await updateProgram({ id: initialData._id, ...values });
        toast.success('プログラムを更新しました');
      }
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast.error('操作に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    try {
      await removeProgram({ id: initialData._id });
      toast.success('プログラムを削除しました');
      setIsOpen(false);
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新しいプログラムを作成' : 'プログラムを編集'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>曲名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 交響曲第5番「運命」" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>曲順名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 第1部" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="作曲者や曲に関する情報を入力..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center pt-4">
              <div>
                {mode === 'edit' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" type="button">
                        削除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          本当に削除しますか？
                        </AlertDialogTitle>
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
                )}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
