import { useDroppable } from '@dnd-kit/core';
import { DraggableMember } from '@/components/custom/DraggableMember';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import type { TMemberListMember } from '@/types/seating';

type MemberListProps = {
  members: TMemberListMember[];
};

export function MemberList({ members }: MemberListProps) {
  const { setNodeRef } = useDroppable({
    id: 'unassigned-area',
  });
  const isMobile = useIsMobile();
  const scrollAreaHeight = isMobile
    ? 'calc(100vh - 18rem)'
    : 'calc(100vh - 16rem)';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">未配置メンバー</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea style={{ height: scrollAreaHeight }} className="p-2 md:p-4">
          <div ref={setNodeRef} className="space-y-2 min-h-full">
            {members.length > 0 ? (
              members.map((member) => (
                <DraggableMember key={member._id} member={member} />
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground pt-10">
                全員配置済みです
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
