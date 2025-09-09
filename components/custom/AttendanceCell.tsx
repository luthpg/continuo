'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRightToLine,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { TStatus } from '@/types/attendance';

// ステータスごとのアイコンと色の設定
const statusConfig = {
  present: { icon: CheckCircle2, color: 'text-green-500', label: '出席' },
  absent: { icon: XCircle, color: 'text-red-500', label: '欠席' },
  late: { icon: Clock, color: 'text-orange-500', label: '遅刻' },
  leave_early: {
    icon: ArrowRightToLine,
    color: 'text-blue-500',
    label: '早退',
  },
  pending: { icon: HelpCircle, color: 'text-muted-foreground', label: '未定' },
};

const attendanceFormSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'leave_early', 'pending']),
  comment: z.string().optional(),
  instead: z.string().optional(),
});

export type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

type AttendanceCellProps = {
  status: TStatus;
  comment?: string | null;
  instead?: string | null;
  onUpdate: (values: AttendanceFormValues) => void;
  isEditable?: boolean;
};

export function AttendanceCell({
  status,
  comment,
  instead,
  onUpdate,
  isEditable = true,
}: AttendanceCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { icon: Icon, color } = statusConfig[status];

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      status: status,
      comment: comment ?? '',
      instead: instead ?? '',
    },
    // Popoverが開いた時に最新のprops値でフォームをリセット
    values: {
      status: status,
      comment: comment ?? '',
      instead: instead ?? '',
    },
  });

  const onSubmit = (values: AttendanceFormValues) => {
    onUpdate(values);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-full flex items-center justify-center p-3 hover:bg-accent focus:outline-none focus:bg-accent transition-colors relative disabled:cursor-not-allowed disabled:opacity-100 disabled:hover:bg-transparent"
          aria-label={`現在のステータス: ${statusConfig[status].label}`}
          disabled={!isEditable}
        >
          <Icon className={cn('h-5 w-5', color)} />
          {(comment || instead) && (
            <MessageSquare className="absolute top-1 right-1 h-2.5 w-2.5 text-primary fill-primary" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>出欠</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) field.onChange(value as TStatus);
                      }}
                      className="grid grid-cols-3 gap-1"
                    >
                      {Object.entries(statusConfig).map(
                        ([key, { icon: OptIcon, label }]) => (
                          <ToggleGroupItem
                            key={key}
                            value={key}
                            className="flex flex-col h-auto p-2 text-xs leading-tight"
                          >
                            <OptIcon className="h-4 w-4 mb-1" />
                            <span>{label}</span>
                          </ToggleGroupItem>
                        ),
                      )}
                    </ToggleGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>コメント</FormLabel>
                  <FormControl>
                    <Input placeholder="遅刻理由など" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>代奏者</FormLabel>
                  <FormControl>
                    <Input placeholder="代奏者名" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              保存
            </Button>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
