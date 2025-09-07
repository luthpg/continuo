'use client';

import { useMutation } from 'convex/react';
import yaml from 'js-yaml';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface PartTemplateSelectorProps {
  organizationId: Id<'organizations'>;
}

type Template = {
  name: string;
  description: string;
  parts: string[];
};

export function PartTemplateSelector({
  organizationId,
}: PartTemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const overwriteParts = useMutation(api.parts.overwritePartsFromTemplate);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/templates/part_templates.yml');
        const yamlText = await response.text();
        const data = yaml.load(yamlText) as { templates: Template[] };
        setTemplates(data.templates);
      } catch (error) {
        console.error('Failed to load part templates:', error);
        toast.error('パートテンプレートの読み込みに失敗しました。');
      }
    };
    fetchTemplates();
  }, []);

  const handleSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (!selectedTemplate) return;

    toast.promise(
      overwriteParts({
        organizationId,
        partNames: selectedTemplate.parts,
      }),
      {
        loading: 'パート設定を更新中...',
        success: `「${selectedTemplate.name}」を適用しました。`,
        error: '更新に失敗しました',
      },
    );
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            テンプレートから読み込み <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {templates.map((template) => (
            <AlertDialogTrigger key={template.name} asChild>
              <DropdownMenuItem onClick={() => handleSelect(template)}>
                {template.name}
              </DropdownMenuItem>
            </AlertDialogTrigger>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            「{selectedTemplate?.name}」を適用しますか？
          </AlertDialogTitle>
          <AlertDialogDescription>
            現在のパート設定はすべて削除され、テンプレートの内容で上書きされます。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            適用する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
