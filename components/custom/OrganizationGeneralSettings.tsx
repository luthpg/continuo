'use client';

import { useMutation } from 'convex/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';

interface OrganizationGeneralSettingsProps {
  organization: Doc<'organizations'>;
}

export function OrganizationGeneralSettings({
  organization,
}: OrganizationGeneralSettingsProps) {
  const [name, setName] = useState(organization.name);
  const updateOrganization = useMutation(api.organizations.update);

  const handleSave = async () => {
    if (!name || name === organization.name) return;
    toast.promise(updateOrganization({ id: organization._id, name }), {
      loading: '団体名を更新中...',
      success: '団体名を更新しました',
      error: '更新に失敗しました',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>団体情報</CardTitle>
        <CardDescription>団体の基本情報を編集します。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">団体名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button
          onClick={handleSave}
          disabled={!name || name === organization.name}
        >
          保存
        </Button>
      </CardFooter>
    </Card>
  );
}
