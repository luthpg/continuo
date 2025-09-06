'use client';

import { useMutation, useQuery } from 'convex/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { useConcertStore } from '@/stores/concert';

interface AssignPositionDialogProps {
  member: {
    _id: Id<'users'>;
    name: string;
    positions: Doc<'positions'>[];
  };
  children: React.ReactNode;
}

export function AssignPositionDialog({
  member,
  children,
}: AssignPositionDialogProps) {
  const { activeOrgId } = useConcertStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<Id<'positions'>[]>(
    () => member.positions.map((p) => p._id),
  );

  const allPositions = useQuery(
    api.positions.getPositionsByOrganization,
    activeOrgId ? { organizationId: activeOrgId } : 'skip',
  );

  const assignPosition = useMutation(api.positionAssignments.assignPosition);
  const unassignPosition = useMutation(
    api.positionAssignments.unassignPosition,
  );

  const handleSave = async () => {
    if (!activeOrgId) return;

    const originalPositions = new Set(member.positions.map((p) => p._id));
    const newPositions = new Set(selectedPositions);

    const toAdd = selectedPositions.filter((p) => !originalPositions.has(p));
    const toRemove = member.positions
      .map((p) => p._id)
      .filter((p) => !newPositions.has(p));

    try {
      await Promise.all([
        ...toAdd.map((positionId) =>
          assignPosition({
            userId: member._id,
            positionId,
            organizationId: activeOrgId,
          }),
        ),
        ...toRemove.map((positionId) =>
          unassignPosition({
            userId: member._id,
            positionId,
            organizationId: activeOrgId,
          }),
        ),
      ]);
      toast.success(`${member.name}さんの役職を更新しました`);
      setIsOpen(false);
    } catch (error) {
      toast.error('役職の更新に失敗しました');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member.name}さんの役職を割り当て</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Command>
            <CommandInput placeholder="役職を検索..." />
            <CommandEmpty>役職が見つかりません。</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {allPositions?.map((position) => {
                const isSelected = selectedPositions.includes(position._id);
                return (
                  <CommandItem
                    key={position._id}
                    value={position.name}
                    onSelect={() => {
                      setSelectedPositions((prev) =>
                        isSelected
                          ? prev.filter((id) => id !== position._id)
                          : [...prev, position._id],
                      );
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {position.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="ghost">
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
