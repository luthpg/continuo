'use client';

import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from 'convex/react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { FullPageSpinner } from '@/components/custom/FullPageSpinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useConcertStore } from '@/stores/concert';

const profileFormSchema = z.object({
  bio: z.string().max(500, { message: '500文字以内で入力してください。' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: Id<'users'> }>();
  const { activeOrgId } = useConcertStore();
  const { user: clerkUser } = useUser();

  const memberDetails = useQuery(
    api.users.getMemberDetails,
    activeOrgId ? { userId: memberId, organizationId: activeOrgId } : 'skip',
  );
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: { bio: memberDetails?.bio ?? '' },
  });

  const isOwnProfile = memberDetails?.clerkId === clerkUser?.id;

  const handleSubmit = (values: ProfileFormValues) => {
    toast.promise(updateUserProfile({ bio: values.bio }), {
      loading: 'プロフィールを更新中...',
      success: '更新しました',
      error: '更新に失敗しました',
    });
  };

  if (memberDetails === undefined) {
    return <FullPageSpinner />;
  }
  if (memberDetails === null) {
    return <div>メンバーが見つかりません。</div>;
  }

  const { name, imageUrl, email, role, part, bio, positions } = memberDetails;

  return (
    <div className="flex-1 flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24 border">
          <AvatarImage src={imageUrl ?? undefined} />
          <AvatarFallback className="text-3xl">
            {name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="text-muted-foreground">{email}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="secondary">{role}</Badge>
            <Badge variant="secondary">{part?.name ?? 'パート未設定'}</Badge>
            {positions?.map((position) => (
              <Badge key={position._id} variant="outline">
                {position.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>自己紹介</CardTitle>
            </CardHeader>
            <CardContent>
              {isOwnProfile ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="自己紹介を入力してください"
                              rows={5}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      保存
                    </Button>
                  </form>
                </Form>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {bio || '自己紹介がありません。'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1">
          {/* TODO: 参加演奏会一覧などを表示 */}
        </div>
      </div>
    </div>
  );
}
