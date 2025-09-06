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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

const assetFormSchema = z.object({
  name: z.string().min(1, { message: 'ファイル名は必須です。' }),
  type: z.enum(['score', 'recording', 'photo', 'text', 'other']),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

const assetTypes = {
  score: '楽譜',
  recording: '音源',
  photo: '写真',
  text: 'テキスト',
  other: 'その他',
} as const;

interface AssetEditDialogProps {
  asset: Doc<'assets'>;
  children: React.ReactNode;
}

export function AssetEditDialog({ asset, children }: AssetEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateAsset = useMutation(api.assets.updateAsset);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: asset.name,
      type: asset.type,
    },
  });

  const handleSubmit = async (values: AssetFormValues) => {
    try {
      await updateAsset({ assetId: asset._id, ...values });
      toast.success('ファイル情報を更新しました');
      setIsOpen(false);
    } catch (error) {
      toast.error('更新に失敗しました');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ファイル情報を編集</DialogTitle>
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
                  <FormLabel>ファイル名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>種類</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="種類を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(assetTypes).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                保存
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
