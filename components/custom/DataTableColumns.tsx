'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/custom/DataTableColumnHeader';
import { DataTableRowActions } from '@/components/custom/DataTableRowActions';
import { PartCell } from '@/components/custom/PartCell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Doc } from '@/convex/_generated/dataModel';
import type { TMember } from '@/types/member';

const roleConfig = {
  admin: { label: '管理者', variant: 'default' },
  subAdmin: { label: '副管理者', variant: 'secondary' },
  member: { label: 'メンバー', variant: 'outline' },
} as const;

export const getColumns = (parts: Doc<'parts'>[]): ColumnDef<TMember>[] => [
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
    accessorKey: 'displayName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="表示名" />
    ),
    cell: ({ row }) => {
      const member = row.original;
      const name = member.displayName ?? member.name;
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={member.imageUrl} alt={name} />
            <AvatarFallback>{name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
          </div>
        </div>
      );
    },
    accessorFn: (row) => row.displayName ?? row.name,
  },
  {
    accessorKey: 'part',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="パート" />
    ),
    cell: ({ row }) => {
      const member = row.original;
      return <PartCell member={member} parts={parts} />;
    },
    accessorFn: (row) => row.part?.name,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="役割" />
    ),
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
    accessorKey: 'positions',
    header: '役職',
    cell: ({ row }) => {
      const positions = row.original.positions;
      if (!positions || positions.length === 0) {
        return '-';
      }
      return (
        <div className="flex flex-wrap gap-1">
          {positions.map((position) => (
            <Badge key={position._id} variant="outline">
              {position.name}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
