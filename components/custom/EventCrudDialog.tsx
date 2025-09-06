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

const eventFormSchema = z.object({
  title: z.string().min(1, { message: 'タイトルは必須です。' }),
  startAt: z.string().min(1, { message: '開始日時は必須です。' }),
  endAt: z.string().min(1, { message: '終了日時は必須です。' }),
  place: z.string().optional(),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventCrudDialogProps {
  mode: 'create' | 'edit';
  concertId: Id<'concerts'>;
  initialData?: Doc<'events'>;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EventCrudDialog({
  mode,
  concertId,
  initialData,
  children,
  open,
  onOpenChange,
}: EventCrudDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);
  const removeEvent = useMutation(api.events.remove);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      startAt: initialData?.startAt || '',
      endAt: initialData?.endAt || '',
      place: initialData?.place || '',
      description: initialData?.description || '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = async (values: EventFormValues) => {
    try {
      if (mode === 'create') {
        await createEvent({ concertId, ...values });
        toast.success('イベントを作成しました');
      } else if (initialData) {
        await updateEvent({ id: initialData._id, ...values });
        toast.success('イベントを更新しました');
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
      await removeEvent({ id: initialData._id });
      toast.success('イベントを削除しました');
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
            {mode === 'create' ? '新しいイベントを作成' : 'イベントを編集'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 全体練習" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>開始日時</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>終了日時</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="place"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>場所</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 第1練習室" {...field} />
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
                    <Textarea placeholder="練習内容など..." {...field} />
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
                          この操作は取り消せません。「{initialData?.title}
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
