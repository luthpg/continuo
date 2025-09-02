'use client';

import { useMutation } from 'convex/react';
import { Paintbrush } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

type ThemeColorSetterProps = {
  organization: Doc<'organizations'>;
};

export function ThemeColorSetter({ organization }: ThemeColorSetterProps) {
  const [color, setColor] = useState(organization.themeColor ?? '#000000');
  const updateThemeColor = useMutation(api.organizations.updateThemeColor);

  const handleSave = () => {
    toast.promise(
      updateThemeColor({
        organizationId: organization._id,
        themeColor: color,
      }),
      {
        loading: 'テーマカラーを保存中...',
        success: '保存しました',
        error: '保存に失敗しました',
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Paintbrush className="h-5 w-5" />
          アクセントカラー
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="theme-color">カラー</Label>
          <Input
            id="theme-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 p-1"
          />
          <span className="font-mono text-sm">{color}</span>
        </div>
        <Button onClick={handleSave} className="w-full">
          保存
        </Button>
      </CardContent>
    </Card>
  );
}
