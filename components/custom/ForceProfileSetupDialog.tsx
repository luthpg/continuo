'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: '2文字以上で入力してください。' })
    .max(50, { message: '50文字以内で入力してください。' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ForceProfileSetupDialogProps {
  isOpen: boolean;
}

export function ForceProfileSetupDialog({
  isOpen,
}: ForceProfileSetupDialogProps) {
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    await toast.promise(
      updateUserProfile({ displayName: values.displayName }),
      {
        loading: 'プロフィールを設定中...',
        success: 'ようこそ！プロフィールを設定しました。',
        error: '設定に失敗しました。',
      },
    );
    // このダイアログは親コンポーネントの再レンダリングによって閉じる
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>ようこそ！</DialogTitle>
          <DialogDescription>
            最初に、アプリ内で表示される名前を設定してください。この名前は後からいつでも変更できます。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>表示名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: 鈴木 一郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                決定
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
