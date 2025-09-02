'use client';

import { useMutation } from 'convex/react';
import { FileUp, Loader2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
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
import type { TAsset } from '@/types/asset';

type UploadAssetDialogProps = {
  concertId: Id<'concerts'>;
  organizationId: Id<'organizations'>;
};

export function UploadAssetDialog({
  concertId,
  organizationId,
}: UploadAssetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<TAsset['type']>('score');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateUploadUrl = useMutation(api.assets.generateUploadUrl);
  const createAsset = useMutation(api.assets.createAsset);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !assetName) {
      toast.error('ファイルとアセット名を入力してください。');
      return;
    }
    setIsSubmitting(true);

    try {
      // 1. アップロードURLをConvexから取得
      const postUrl = await generateUploadUrl();

      // 2. 取得したURLにファイルをPOST
      const result = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // 3. ファイルのstorageIdを使って、アセット情報をDBに保存
      await createAsset({
        storageId,
        name: assetName,
        type: assetType,
        concertId,
        organizationId,
      });

      toast.success('ファイルをアップロードしました。');
      // フォームをリセットしてダイアログを閉じる
      setAssetName('');
      setFile(null);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('アップロードに失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileUp className="mr-2 h-4 w-4" />
          新規アップロード
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規アセットのアップロード</DialogTitle>
          <DialogDescription>
            楽譜や音源ファイルをアップロードします。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="asset-name">アセット名</Label>
            <Input
              id="asset-name"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="例: ブラームス交響曲第1番 パート譜"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="asset-type">種類</Label>
            <Select
              value={assetType}
              onValueChange={(value: TAsset['type']) => setAssetType(value)}
            >
              <SelectTrigger id="asset-type">
                <SelectValue placeholder="種類を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">楽譜</SelectItem>
                <SelectItem value="recording">音源</SelectItem>
                <SelectItem value="photo">写真</SelectItem>
                <SelectItem value="text">テキスト</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file">ファイル</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || !file || !assetName}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              アップロード
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
