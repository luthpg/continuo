'use client';

import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import type { Doc } from '@/convex/_generated/dataModel';

const orgSettingsSchema = z.object({
  name: z.string().min(1, { message: '団体名は必須です。' }),
  description: z.string().optional(),
  websiteUrl: z
    .string()
    .url({ message: '有効なURLを入力してください。' })
    .optional()
    .or(z.literal('')),
  practiceLocation: z.string().optional(),
});

type OrgSettingsFormValues = z.infer<typeof orgSettingsSchema>;

interface OrganizationGeneralSettingsProps {
  organization: Doc<'organizations'>;
}

export function OrganizationGeneralSettings({
  organization,
}: OrganizationGeneralSettingsProps) {
  const { user } = useUser();
  const router = useRouter();
  const updateOrganization = useMutation(api.organizations.update);
  const deleteOrganization = useMutation(api.organizations.deleteOrganization);

  const form = useForm<OrgSettingsFormValues>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      name: organization.name,
      description: organization.description ?? '',
      websiteUrl: organization.websiteUrl ?? '',
      practiceLocation: organization.practiceLocation ?? '',
    },
  });

  const { isDirty, isSubmitting } = form.formState;
  const isOwner = organization.ownerId === user?.id;

  const onSubmit = async (values: OrgSettingsFormValues) => {
    toast.promise(updateOrganization({ id: organization._id, ...values }), {
      loading: '団体情報を更新中...',
      success: () => {
        form.reset(values); // フォームの状態を更新後の値でリセット
        return '団体情報を更新しました';
      },
      error: '更新に失敗しました',
    });
  };

  const handleDelete = async () => {
    toast.promise(deleteOrganization({ organizationId: organization._id }), {
      loading: '団体を削除中...',
      success: () => {
        router.push('/hall/select-org');
        return '団体を削除しました';
      },
      error: (err) => {
        console.error(err);
        return '削除に失敗しました';
      },
    });
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>団体情報</CardTitle>
            <CardDescription>団体の基本情報を編集します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>団体名</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>紹介文</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="団体の活動方針や特徴など..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公式サイトURL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="practiceLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>主な練習場所</FormLabel>
                  <FormControl>
                    <Input placeholder="〇〇市民センター" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex justify-between">
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </Button>

            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">団体を削除</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。団体「{organization.name}
                      」と、演奏会、メンバー、出欠記録など、関連するすべてのデータが完全に削除されます。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      削除する
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
