'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea'; // Textarea を追加
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const positionFormSchema = z.object({
  name: z.string().min(1, { message: '役職名は必須です。' }),
  description: z.string().optional(),
});

type PositionFormValues = z.infer<typeof positionFormSchema>;

interface PositionCrudDialogProps {
  mode: 'create' | 'edit';
  organizationId: Id<'organizations'>;
  initialData?: Doc<'positions'>;
  children: React.ReactNode;
}

export function PositionCrudDialog({
  mode,
  organizationId,
  initialData,
  children,
}: PositionCrudDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const createPosition = useMutation(api.positions.create);
  const updatePosition = useMutation(api.positions.update);

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = async (values: PositionFormValues) => {
    try {
      if (mode === 'create') {
        await createPosition({ organizationId, ...values });
        toast.success('役職を作成しました');
      } else if (initialData) {
        await updatePosition({ id: initialData._id, ...values });
        toast.success('役職を更新しました');
      }
      setIsOpen(false);
      form.reset();
    } catch (_error) {
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
            description: initialData?.description || '',
          });
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? '新しい役職を作成' : '役職を編集'}
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
                  <FormLabel>役職名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: コンサートマスター" {...field} />
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
                  <FormLabel>説明 (任意)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="役職の説明を入力..." {...field} />
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
