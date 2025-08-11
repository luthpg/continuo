'use client';

import {
  ArrowRightToLine,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TStatus } from '@/types/attendance';

type AttendanceCellProps = {
  status: TStatus;
  onStatusChange: (newStatus: TStatus) => void;
};

// ステータスごとのアイコンと色の設定
const statusConfig = {
  present: { icon: CheckCircle2, color: 'text-green-500', label: '出席' },
  absent: { icon: XCircle, color: 'text-red-500', label: '欠席' },
  late: { icon: Clock, color: 'text-orange-500', label: '遅刻' },
  leave_early: {
    icon: ArrowRightToLine,
    color: 'text-blue-500',
    label: '早退',
  },
  pending: { icon: HelpCircle, color: 'text-muted-foreground', label: '未定' },
};

const statusOptions: TStatus[] = [
  'present',
  'absent',
  'late',
  'leave_early',
  'pending',
];

export function AttendanceCell({
  status,
  onStatusChange,
}: AttendanceCellProps) {
  const { icon: Icon, color } = statusConfig[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full h-full flex items-center justify-center p-3 hover:bg-accent focus:outline-none focus:bg-accent transition-colors"
          aria-label={`現在のステータス: ${statusConfig[status].label}`}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {statusOptions.map((option) => {
          const {
            icon: OptionIcon,
            color: optionColor,
            label,
          } = statusConfig[option];
          return (
            <DropdownMenuItem
              key={option}
              onSelect={() => onStatusChange(option)}
            >
              <OptionIcon className={cn('mr-2 h-4 w-4', optionColor)} />
              <span>{label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
