'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

// getMembersByOrganizationの返り値の要素の型
export type OrganizationMember = {
  _id: Id<'users'>;
  name: string;
  email: string;
  imageUrl: string | null;
  role: 'admin' | 'subAdmin' | 'member';
  part: string;
  partId: Id<'parts'> | null;
};

const addMembersFormSchema = z.object({
  memberIds: z.array(z.string()).refine((value) => value.length > 0, {
    message: '少なくとも1人のメンバーを選択してください。',
  }),
});

type AddMembersFormValues = z.infer<typeof addMembersFormSchema>;

interface AddConcertMemberDialogProps {
  concertId: Id<'concerts'>;
  unassignedMembers: OrganizationMember[];
  children: React.ReactNode;
}

export function AddConcertMemberDialog({
  concertId,
  unassignedMembers,
  children,
}: AddConcertMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const addMember = useMutation(api.concertMemberships.addMember);

  const form = useForm<AddMembersFormValues>({
    resolver: zodResolver(addMembersFormSchema),
    defaultValues: {
      memberIds: [],
    },
  });

  const handleSubmit = async (values: AddMembersFormValues) => {
    try {
      await Promise.all(
        values.memberIds.map((userId) =>
          addMember({ concertId, userId: userId as Id<'users'> }),
        ),
      );
      toast.success(`${values.memberIds.length}人のメンバーを追加しました`);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast.error('メンバーの追加に失敗しました');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>演奏会にメンバーを追加</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <FormField
              control={form.control}
              name="memberIds"
              render={() => (
                <FormItem className="max-h-60 overflow-y-auto">
                  {unassignedMembers.map((member) => (
                    <FormField
                      key={member._id}
                      control={form.control}
                      name="memberIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={member._id}
                            className="flex flex-row items-start space-x-3 space-y-0 p-2"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(member._id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...(field.value ?? []),
                                        member._id,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== member._id,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {member.name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '追加中...' : '追加'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
