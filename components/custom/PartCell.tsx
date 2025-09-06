'use client';

import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useConcertStore } from '@/stores/concert';
import type { TMember } from '@/types/member';
import type { TPart } from '@/types/seating';

type PartCellProps = {
  member: TMember;
  parts: TPart[];
};

export function PartCell({ member, parts }: PartCellProps) {
  const { activeOrgId } = useConcertStore();

  const updatePart = useMutation(api.partMemberships.updatePartMembership);

  const handlePartChange = (newPartId: Id<'parts'>) => {
    if (!activeOrgId) return;

    toast.promise(
      updatePart({
        organizationId: activeOrgId,
        userId: member._id,
        partId: newPartId,
      }),
      {
        loading: `${member.name}のパートを更新中...`,
        success: 'パートを更新しました',
        error: 'パートの更新に失敗しました',
      },
    );
  };

  return (
    <Select value={member.part?._id ?? ''} onValueChange={handlePartChange}>
      <SelectTrigger className="w-40 border-none bg-transparent shadow-none focus:ring-0">
        <SelectValue placeholder="パートを選択" />
      </SelectTrigger>
      <SelectContent>
        {parts.map((part) => (
          <SelectItem key={part._id} value={part._id}>
            {part.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
