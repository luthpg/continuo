'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from '@/components/custom/data-table-row-actions';
import { PartCell } from '@/components/custom/PartCell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { TMember } from '@/types/member';

const roleConfig = {
  admin: { label: '管理者', variant: 'default' },
  subAdmin: { label: '副管理者', variant: 'secondary' },
  member: { label: 'メンバー', variant: 'outline' },
} as const;

export const columns: ColumnDef<TMember>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: '名前',
    cell: ({ row }) => {
      const member = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={member.imageUrl} alt={member.name} />
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{member.name}</div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'part',
    header: 'パート',
    cell: ({ row }) => {
      const member = row.original;
      return <PartCell member={member} parts={parts} />;
    },
  },
  {
    accessorKey: 'role',
    header: '役割',
    cell: ({ row }) => {
      const role = row.original.role;
      const config = roleConfig[role];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
