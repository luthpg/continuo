'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const partFormSchema = z.object({
  name: z.string().min(1, { message: 'パート名は必須です。' }),
  maxCounts: z.coerce.number().optional(), // coerceで文字列を数値に変換
});

type PartFormValues = z.infer<typeof partFormSchema>;

interface PartCrudDialogProps {
  mode: 'create' | 'edit';
  organizationId: Id<'organizations'>;
  initialData?: Doc<'parts'>;
  children: React.ReactNode;
}

export function PartCrudDialog({
  mode,
  organizationId,
  initialData,
  children,
}: PartCrudDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const createPart = useMutation(api.parts.create);
  const updatePart = useMutation(api.parts.update);

  const form = useForm<FieldValues, unknown, PartFormValues>({
    resolver: zodResolver<FieldValues, unknown, PartFormValues>(partFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      maxCounts: initialData?.maxCounts,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = async (values: PartFormValues) => {
    try {
      if (mode === 'create') {
        await createPart({ organizationId, ...values });
        toast.success('パートを作成しました');
      } else if (initialData) {
        await updatePart({ id: initialData._id, ...values });
        toast.success('パートを更新しました');
      }
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast.error('操作に失敗しました');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          form.reset({
            name: initialData?.name || '',
            maxCounts: initialData?.maxCounts,
          });
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新しいパートを作成' : 'パートを編集'}
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
                  <FormLabel>パート名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 1st Violin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxCounts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大人数 (任意)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
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
