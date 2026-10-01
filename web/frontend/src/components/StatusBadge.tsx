import type { TaskStatus } from '@/types'

/** 终端状态标签：[RUN] / [DONE] / [FAIL] / [PENDING] / [PAUSED] */
const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: 'PENDING', className: 'text-txt-muted' },
  running: { label: 'RUN', className: 'text-accent' },
  paused: { label: 'PAUSED', className: 'text-warning' },
  success: { label: 'DONE', className: 'text-txt-primary' },
  failed: { label: 'FAIL', className: 'text-error' },
}

export function StatusBadge({ status }: { status: TaskStatus | string }) {
  const conf = statusConfig[status as TaskStatus] ?? { label: status.toUpperCase(), className: 'text-txt-secondary' }
  return (
    <span className={`font-mono text-xs font-medium tracking-wider ${conf.className}`}>
      [{conf.label}]
    </span>
  )
}
