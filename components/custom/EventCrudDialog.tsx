'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type FieldValues, useForm } from 'react-hook-form';
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
import { Calendar } from '@/components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { cn } from '@/lib/utils';

const eventFormSchema = z
  .object({
    title: z.string().min(1, { message: 'タイトルは必須です。' }),
    place: z.string().optional(),
    description: z.string().optional(),
    // Time settings
    timeInputMode: z.enum(['specific', 'slot']).default('specific'),
    startAt: z.string(),
    endAt: z.string(),
    // Slot specific
    date: z.date().optional(),
    timeSlot: z.enum(['morning', 'afternoon', 'evening']).optional(),
    // Recurring settings
    isRecurring: z.boolean().default(false),
    frequency: z.enum(['weekly', 'monthly']).optional(),
    interval: z.coerce.number().optional(),
    weekdays: z.array(z.string()).optional(),
    until: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.timeInputMode === 'specific') {
        return !!data.startAt && !!data.endAt;
      }
      if (data.timeInputMode === 'slot') {
        return !!data.date && !!data.timeSlot;
      }
      return false;
    },
    {
      message: '時間またはコマを正しく設定してください。',
      path: ['timeInputMode'],
    },
  )
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

const timeSlots = {
  morning: { label: '朝', start: '09:00', end: '12:00' },
  afternoon: { label: '昼', start: '13:00', end: '17:00' },
  evening: { label: '夜', start: '18:00', end: '21:00' },
};

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

  const form = useForm<FieldValues, unknown, EventFormValues>({
    resolver: zodResolver<FieldValues, unknown, EventFormValues>(
      eventFormSchema,
    ),
    defaultValues: {
      title: initialData?.title || '',
      place: initialData?.place || '',
      description: initialData?.description || '',
      timeInputMode: 'specific',
      startAt: initialData?.startAt || '',
      endAt: initialData?.endAt || '',
      isRecurring: false,
      interval: 1,
    },
  });

  const { isSubmitting } = form.formState;
  const timeInputMode: EventFormValues['timeInputMode'] =
    form.watch('timeInputMode');
  const isRecurring: EventFormValues['isRecurring'] = form.watch('isRecurring');
  const selectedDate: EventFormValues['date'] = form.watch('date');
  const selectedTimeSlot: EventFormValues['timeSlot'] = form.watch('timeSlot');

  useEffect(() => {
    if (timeInputMode === 'slot' && selectedDate && selectedTimeSlot) {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      const { start, end } = timeSlots[selectedTimeSlot];
      form.setValue('startAt', `${dateStr}T${start}`);
      form.setValue('endAt', `${dateStr}T${end}`);
    }
  }, [selectedDate, selectedTimeSlot, timeInputMode, form]);

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
    } catch (_error) {
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

            <FormField
              control={form.control}
              name="timeInputMode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>時間設定</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4"
                      disabled={mode === 'edit'} // 編集モードでは変更不可
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="specific" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          時間で指定
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="slot" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          コマで指定
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {timeInputMode === 'specific' ? (
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
            ) : (
              <div className="flex flex-col md:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>日付</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-[240px] pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                dayjs(field.value).format('YYYY/MM/DD')
                              ) : (
                                <span>日付を選択</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeSlot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>コマ</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          variant="outline"
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex-wrap justify-start"
                        >
                          {Object.entries(timeSlots).map(([key, { label }]) => (
                            <ToggleGroupItem key={key} value={key}>
                              {label}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                          disabled={timeInputMode === 'slot'} // コマ指定時は繰り返し不可
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>イベントを繰り返す</FormLabel>
                        <FormDescription>
                          毎週、毎月など、定期的なイベントを一括で作成します。
                          (コマ指定時は利用できません)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                {isRecurring && timeInputMode === 'specific' && (
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
