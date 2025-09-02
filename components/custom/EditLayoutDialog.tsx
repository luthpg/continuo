'use client';

import { useMutation } from 'convex/react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { TPart } from '@/types/seating';

type EditLayoutDialogProps = {
  concertId: Id<'concerts'>;
  organizationId: Id<'organizations'>;
  parts: TPart[];
  programId: Id<'programs'> | null;
};

type LayoutRow = {
  id: number;
  partId: Id<'parts'> | '';
  count: number;
};

export function EditLayoutDialog({
  concertId,
  organizationId,
  parts,
  programId,
}: EditLayoutDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutRow[]>([
    { id: 1, partId: '', count: 1 },
  ]);
  const createOrUpdateLayout = useMutation(api.seatings.createOrUpdateLayout);

  const addRow = () => {
    setLayout([...layout, { id: Date.now(), partId: '', count: 1 }]);
  };

  const removeRow = (id: number) => {
    setLayout(layout.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: number,
    field: 'partId' | 'count',
    value: string | number,
  ) => {
    setLayout(
      layout.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleSubmit = async () => {
    const formattedLayout = layout
      .filter((row) => row.partId && row.count > 0)
      .map((row) => ({
        partId: row.partId as Id<'parts'>,
        count: Number(row.count),
      }));

    if (formattedLayout.length === 0) {
      toast.error('有効なパートがありません。');
      return;
    }

    toast.promise(
      createOrUpdateLayout({
        concertId,
        organizationId,
        programId,
        layout: formattedLayout,
      }),
      {
        loading: 'レイアウトを保存中...',
        success: () => {
          setIsOpen(false);
          return 'レイアウトを保存しました。';
        },
        error: '保存に失敗しました。',
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">レイアウト編集</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>席次レイアウト編集</DialogTitle>
          <DialogDescription>
            各パートの人数（席数）を設定してください。弦楽器は奏者数、その他は席数を入力します。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
          {layout.map((row, index) => (
            <div key={row.id} className="flex items-center gap-2">
              <Label className="w-10 text-right">{index + 1}.</Label>
              <Select
                value={row.partId}
                onValueChange={(value) => updateRow(row.id, 'partId', value)}
              >
                <SelectTrigger>
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
              <Input
                type="number"
                min="1"
                value={row.count}
                onChange={(e) => updateRow(row.id, 'count', e.target.value)}
                className="w-24"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={addRow} className="mt-2">
          <PlusCircle className="mr-2 h-4 w-4" />
          パートを追加
        </Button>
        <DialogFooter>
          <Button onClick={handleSubmit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
