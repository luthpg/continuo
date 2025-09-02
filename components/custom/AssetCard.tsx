'use client';

import { useMutation } from 'convex/react';
import {
  Download,
  File as FileIcon,
  FileMusic,
  FileText,
  ImageIcon,
  MoreVertical,
  Trash2,
} from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/convex/_generated/api';
import type { TAsset } from '@/types/asset';

type AssetCardProps = {
  asset: TAsset;
};

// アセットの種類に応じたアイコンを返すヘルパーオブジェクト
const assetIcons = {
  score: <FileMusic className="h-8 w-8 text-muted-foreground" />,
  recording: <FileMusic className="h-8 w-8 text-muted-foreground" />,
  photo: <ImageIcon className="h-8 w-8 text-muted-foreground" />,
  text: <FileText className="h-8 w-8 text-muted-foreground" />,
  other: <FileIcon className="h-8 w-8 text-muted-foreground" />,
};

export function AssetCard({ asset }: AssetCardProps) {
  const deleteAsset = useMutation(api.assets.deleteAsset);

  const handleDelete = () => {
    toast.promise(deleteAsset({ assetId: asset._id }), {
      loading: 'アセットを削除中...',
      success: '削除しました',
      error: '削除に失敗しました',
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {assetIcons[asset.type]}
          <div>
            <CardTitle className="text-base font-medium leading-tight truncate">
              {asset.name}
            </CardTitle>
            <CardDescription className="text-xs">
              {new Date(asset._creationTime).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                ダウンロード
              </a>
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  削除
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消せません。「{asset.name}
                    」を完全に削除します。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    削除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1" />
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            ダウンロード
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
