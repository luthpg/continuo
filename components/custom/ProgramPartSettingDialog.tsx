'use client';

import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';

interface ProgramPartSettingDialogProps {
  program: Doc<'programs'>;
  children: React.ReactNode;
}

type Setting = {
  partId: Id<'parts'>;
  partName: string;
  count: number;
};

export function ProgramPartSettingDialog({
  program,
  children,
}: ProgramPartSettingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);

  const allParts = useQuery(
    api.parts.getPartsByOrganization,
    program ? { organizationId: program.organizationId } : 'skip',
  );
  const currentSettings = useQuery(
    api.programParts.getPartSettings,
    isOpen && program ? { programId: program._id } : 'skip',
  );
  const updateSettings = useMutation(api.programParts.updatePartSettings);

  useEffect(() => {
    if (allParts && currentSettings) {
      const settingsMap = new Map(
        currentSettings.map((s) => [s.partId, s.count]),
      );
      const newSettings = allParts.map((part) => ({
        partId: part._id,
        partName: part.name,
        count: settingsMap.get(part._id) ?? 0,
      }));
      setSettings(newSettings);
    }
  }, [allParts, currentSettings]);

  const handleCountChange = (partId: Id<'parts'>, count: number) => {
    const newCount = Math.max(0, count); // 0未満は許可しない
    setSettings((prev) =>
      prev.map((s) => (s.partId === partId ? { ...s, count: newCount } : s)),
    );
  };

  const handleSave = async () => {
    const settingsToSave = settings
      .filter((s) => s.count > 0)
      .map(({ partId, count }) => ({ partId, count }));

    toast.promise(
      updateSettings({
        programId: program._id,
        organizationId: program.organizationId,
        settings: settingsToSave,
      }),
      {
        loading: 'パート編成を保存中...',
        success: () => {
          setIsOpen(false);
          return '保存しました';
        },
        error: '保存に失敗しました',
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>「{program.name}」のパート編成</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {settings.length > 0
              ? settings.map((setting) => (
                  <div
                    key={setting.partId}
                    className="flex items-center justify-between"
                  >
                    <Label htmlFor={setting.partId}>{setting.partName}</Label>
                    <Input
                      id={setting.partId}
                      type="number"
                      min={0}
                      value={setting.count}
                      onChange={(e) =>
                        handleCountChange(
                          setting.partId,
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                      className="w-20"
                    />
                  </div>
                ))
              : // Skeleton loaders
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                ))}
          </div>
        </ScrollArea>
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
