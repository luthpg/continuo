'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import type { Doc } from '@/convex/_generated/dataModel';

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

interface ConcertFormProps {
  initialData?: Doc<'concerts'>;
  onSubmit: (values: ConcertFormValues) => void;
  isSubmitting: boolean;
}

export function ConcertForm({
  initialData,
  onSubmit,
  isSubmitting,
}: ConcertFormProps) {
  const form = useForm<ConcertFormValues>({
    resolver: zodResolver(concertFormSchema),
    defaultValues: initialData ?? {
      name: '',
      date: '',
      place: '',
      openTime: '',
      startTime: '',
      description: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>演奏会名</FormLabel>
              <FormControl>
                <Input placeholder="例: 第10回定期演奏会" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>開催日</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="place"
          render={({ field }) => (
            <FormItem>
              <FormLabel>会場</FormLabel>
              <FormControl>
                <Input placeholder="例: コンティーノホール" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="openTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>開場時間</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>開演時間</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>説明</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="演奏会の詳細や曲目などを入力します。"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : '保存'}
        </Button>
      </form>
    </Form>
  );
}
