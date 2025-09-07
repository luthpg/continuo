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
import { Checkbox } from '@/components/ui/checkbox';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const eventFormSchema = z
  .object({
    title: z.string().min(1, { message: 'タイトルは必須です。' }),
    startAt: z.string().min(1, { message: '開始日時は必須です。' }),
    endAt: z.string().min(1, { message: '終了日時は必須です。' }),
    place: z.string().optional(),
    description: z.string().optional(),
    isRecurring: z.boolean().default(false),
    frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
    interval: z.coerce.number().optional(),
    weekdays: z.array(z.string()).optional(),
    until: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return !!data.frequency && !!data.interval && !!data.until;
      }
      return true;
    },
    {
      message: '繰り返し設定が不完全です。',
      path: ['isRecurring'],
    },
  )
  .refine(
    (data) => {
      if (data.isRecurring && data.frequency === 'weekly') {
        return data.weekdays && data.weekdays.length > 0;
      }
      return true;
    },
    {
      message: '曜日を選択してください。',
      path: ['weekdays'],
    },
  );

type EventFormValues = z.infer<typeof eventFormSchema>;

const weekdayOptions = [
  { value: 'SU', label: '日' },
  { value: 'MO', label: '月' },
  { value: 'TU', label: '火' },
  { value: 'WE', label: '水' },
  { value: 'TH', label: '木' },
  { value: 'FR', label: '金' },
  { value: 'SA', label: '土' },
];

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

  const createEvents = useMutation(api.events.create);
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
      isRecurring: false,
      interval: 1,
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const isRecurring = form.watch('isRecurring');

  const handleSubmit = async (values: EventFormValues) => {
    try {
      if (mode === 'create') {
        await createEvents({ concertId, ...values });
        toast.success('イベントを作成しました');
      } else if (initialData) {
        await updateEvent({ id: initialData._id, ...values });
        toast.success('イベントを更新しました');
      }
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
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
      <DialogContent className="max-w-2xl">
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
                      <Input type="datetime-local" step={300} {...field} />
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
                      <Input type="datetime-local" step={300} {...field} />
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

            {mode === 'create' && (
              <>
                <Separator className="my-6" />
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>イベントを繰り返す</FormLabel>
                        <FormDescription>
                          毎週、毎月など、定期的なイベントを一括で作成します。
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                {isRecurring && (
                  <div className="space-y-4 rounded-md border p-4">
                    <div className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>繰り返し</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="選択..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">毎週</SelectItem>
                                <SelectItem value="monthly">毎月</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="interval"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="pb-2">
                        {form.watch('frequency') === 'weekly'
                          ? '週間ごと'
                          : 'ヶ月ごと'}
                      </span>
                    </div>
                    {form.watch('frequency') === 'weekly' && (
                      <FormField
                        control={form.control}
                        name="weekdays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>曜日</FormLabel>
                            <FormControl>
                              <ToggleGroup
                                type="multiple"
                                variant="outline"
                                value={field.value}
                                onValueChange={field.onChange}
                                className="flex-wrap justify-start"
                              >
                                {weekdayOptions.map((opt) => (
                                  <ToggleGroupItem
                                    key={opt.value}
                                    value={opt.value}
                                  >
                                    {opt.label}
                                  </ToggleGroupItem>
                                ))}
                              </ToggleGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="until"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>終了日</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </>
            )}

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
