import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { TerminalProgress } from '@/components/ui/terminal-progress'
import { StatusBadge } from '@/components/StatusBadge'
import { useDeleteTask, useTasks } from '@/hooks/useTasks'
import { formatBytes, displayStage, formatDuration } from '@/lib/utils'

const statusFilters = [
  { value: '', label: 'ALL' },
  { value: 'pending', label: 'PENDING' },
  { value: 'running', label: 'RUNNING' },
  { value: 'paused', label: 'PAUSED' },
  { value: 'success', label: 'COMPLETED' },
  { value: 'failed', label: 'FAILED' },
]

/** 任务列表页：htop 风格表格 + 文字操作链接 */
export default function TasksPage() {
  const [status, setStatus] = useState('')
  const { data: tasks, isLoading } = useTasks(status || undefined)
  const deleteTask = useDeleteTask()

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this task? Analysis artifacts will be removed.')) deleteTask.mutate(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono">
        <h1 className="text-sm uppercase tracking-widest text-txt-primary">
          <span className="text-accent">##</span> task queue
        </h1>
        <div className="flex items-center gap-3 text-xs">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={
                status === f.value
                  ? 'border-b border-accent pb-0.5 text-accent'
                  : 'text-txt-secondary hover:text-txt-primary'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="font-mono text-xs text-txt-muted">
          loading<span className="cursor-blink" />
        </p>
      ) : !tasks || tasks.length === 0 ? (
        <div className="border border-dashed border-brd p-12 text-center font-mono text-xs text-txt-muted">
          no analysis tasks. run <span className="text-accent">$ analyze</span> to submit a firmware.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <th>Status</th>
              <th>Task ID</th>
              <th>Filename</th>
              <th>Stage</th>
              <th className="w-72">Progress</th>
              <th>Size</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell className="text-txt-secondary">{task.id}</TableCell>
                <TableCell className="max-w-56 truncate text-txt-primary" title={task.filename}>
                  <Link to={`/tasks/${task.id}`} className="hover:text-accent hover:underline">
                    {task.filename}
                  </Link>
                </TableCell>
                <TableCell className="max-w-48 truncate text-txt-secondary" title={task.stage}>
                  {displayStage(task.stage)}
                </TableCell>
                <TableCell>
                  <TerminalProgress
                    stage=""
                    value={task.progress}
                    elapsed={task.duration_seconds != null ? formatDuration(task.duration_seconds) : undefined}
                  />
                </TableCell>
                <TableCell className="text-txt-muted">{formatBytes(task.file_size)}</TableCell>
                <TableCell className="text-txt-muted">
                  {new Date(task.created_at).toLocaleString('en-GB')}
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/tasks/${task.id}`} className="mr-3 text-accent hover:underline">
                    [view]
                  </Link>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={task.status === 'pending' || task.status === 'running'}
                    className="text-error disabled:pointer-events-none disabled:opacity-30 hover:underline"
                    title={task.status === 'pending' || task.status === 'running' ? 'pause before deleting' : 'delete'}
                  >
                    [del]
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
