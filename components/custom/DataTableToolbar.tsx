'use client';

import type { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { DataTableFacetedFilter } from '@/components/custom/DataTableFacetedFilter';
import { DataTableViewOptions } from '@/components/custom/DataTableViewOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Doc } from '@/convex/_generated/dataModel';

const roleConfig = {
  admin: { label: '管理者' },
  subAdmin: { label: '副管理者' },
  member: { label: 'メンバー' },
} as const;

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  parts?: Doc<'parts'>[];
}

export function DataTableToolbar<TData>({
  table,
  parts,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const partOptions =
    parts?.map((part) => ({ value: part.name, label: part.name })) ?? [];

  const roleOptions = Object.entries(roleConfig).map(([key, { label }]) => ({
    value: key,
    label: label,
  }));

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="名前でフィルター..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('part') && (
          <DataTableFacetedFilter
            column={table.getColumn('part')}
            title="パート"
            options={partOptions}
          />
        )}
        {table.getColumn('role') && (
          <DataTableFacetedFilter
            column={table.getColumn('role')}
            title="役割"
            options={roleOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
