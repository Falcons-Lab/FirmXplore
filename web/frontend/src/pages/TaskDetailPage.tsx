import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TerminalProgress } from '@/components/ui/terminal-progress'
import { StatusBadge } from '@/components/StatusBadge'
import { LogConsole } from '@/components/LogConsole'
import { FindingsView } from '@/components/FindingsView'
import { TopologyGraph } from '@/components/TopologyGraph'
import { useTask } from '@/hooks/useTasks'
import { useTaskStream } from '@/hooks/useTaskStream'
import { artifactUrl, getArtifacts, getGraph, getModelUsage, getReportJSON, getReportMarkdown, reportDownloadUrl, resumeTask, stopTask } from '@/api/client'
import { formatBytes, displayStage, formatDuration } from '@/lib/utils'
import type { ReportJSON } from '@/types'

/** 任务详情页：终端进度条 + SSE 实时日志 + PAUSE/RESUME + 拓扑图 + 产物 + 报告 */
export default function TaskDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const { data: task } = useTask(id, true)
  const { event, logs, graphVersion } = useTaskStream(id || undefined)

  const status = event?.status ?? task?.status ?? 'pending'
  const stage = event?.stage ?? task?.stage ?? ''
  const progress = event?.progress ?? task?.progress ?? 0
  const error = event?.error ?? task?.error
  const live = status === 'pending' || status === 'running'
  const reportReady = Boolean(task?.report_paths && Object.keys(task.report_paths).length > 0)

  // 运行中每秒跳动显示已耗时；结束后用后端记录的 duration_seconds
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(t)
  }, [live])
  const elapsed = live && task
    ? formatDuration((Date.now() - new Date(task.created_at).getTime()) / 1000)
    : task?.duration_seconds != null
      ? formatDuration(task.duration_seconds)
      : undefined

  const stop = useMutation({
    mutationFn: () => stopTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', id] }),
  })
  const resume = useMutation({
    mutationFn: () => resumeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono">
        <div className="flex items-baseline gap-3 text-sm">
          <span className="text-accent">task:</span>
          <h1 className="text-txt-primary">{task?.filename ?? id}</h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <Button variant="outline" size="sm" onClick={() => stop.mutate()} disabled={stop.isPending}>
              {stop.isPending ? '> pausing...' : '> pause'}
            </Button>
          )}
          {status === 'paused' && (
            <Button size="sm" onClick={() => resume.mutate()} disabled={resume.isPending}>
              {resume.isPending ? '> resuming...' : '$ firmxplore resume'}
            </Button>
          )}
          <Link to="/">
            <Button variant="ghost" size="sm">{'< back'}</Button>
          </Link>
        </div>
      </div>

      {/* 阶段进度：GHIDRA_ANALYSIS [████████░░░░░░░░░░░░] 60% 120.4s */}
      <div className="border border-brd bg-bg-card px-4 py-3">
        <TerminalProgress stage={displayStage(stage) || 'waiting'} value={progress} elapsed={elapsed} />
        {error && <p className="mt-2 border-l-2 border-error bg-error/5 px-2 py-1 font-mono text-xs text-error">{error}</p>}
        {status === 'paused' && (
          <p className="mt-2 border-l-2 border-warning bg-warning/5 px-2 py-1 font-mono text-xs text-warning">
            task paused — artifacts preserved. run resume to continue (fwagent resume).
          </p>
        )}
        <p className="mt-2 font-mono text-xs text-txt-muted">id: {id}</p>
      </div>

      <section>
        <SectionTitle label="console" />
        <LogConsole lines={logs} />
      </section>

      {(reportReady || live) && <TopologySection taskId={id} live={live} graphVersion={graphVersion} />}

      <ModelUsageSection taskId={id} />

      {reportReady && <ReportSection taskId={id} />}

      <ArtifactsSection taskId={id} enabled={!live || reportReady} />
    </div>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-txt-secondary">
      <span className="text-accent">##</span> {label}
    </h2>
  )
}

/** 拓扑图：SSE graph 事件驱动实时刷新 + 15s 兜底轮询 */
function TopologySection({ taskId, live, graphVersion }: { taskId: string; live: boolean; graphVersion: number }) {
  const queryClient = useQueryClient()
  const { data: graph, isLoading, error } = useQuery({
    queryKey: ['graph', taskId],
    queryFn: () => getGraph(taskId),
    refetchInterval: live ? 15000 : false,
    retry: false,
  })

  useEffect(() => {
    if (graphVersion > 0) {
      queryClient.invalidateQueries({ queryKey: ['graph', taskId] })
    }
  }, [graphVersion, taskId, queryClient])

  return (
    <section>
      <SectionTitle label="correlation topology" />
      <div className="border border-brd bg-bg-card p-4">
        {isLoading ? (
          <p className="font-mono text-xs text-txt-muted">
            loading<span className="cursor-blink" />
          </p>
        ) : error ? (
          <p className="border border-dashed border-brd p-8 text-center font-mono text-xs text-txt-muted">
            topology not yet generated — available after COMPONENT_CORRELATION completes.
          </p>
        ) : graph ? (
          <TopologyGraph graph={graph} />
        ) : null}
      </div>
    </section>
  )
}

/** 模型消耗面板：web_model_usage.jsonl 汇总；从未调用时整体隐藏 */
function ModelUsageSection({ taskId }: { taskId: string }) {
  const { data } = useQuery({
    queryKey: ['model-usage', taskId],
    queryFn: () => getModelUsage(taskId),
    retry: false,
  })
  if (!data || data.totals.calls === 0) return null
  const t = data.totals
  return (
    <section>
      <SectionTitle label="model usage" />
      <div className="border border-brd bg-bg-card p-4 font-mono text-xs">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-txt-secondary">
          <span>calls: <span className="text-accent">{t.calls}</span></span>
          <span>prompt: <span className="text-txt-primary">{t.prompt_tokens.toLocaleString()}</span></span>
          <span>completion: <span className="text-txt-primary">{t.completion_tokens.toLocaleString()}</span></span>
          <span>total: <span className="text-accent">{t.total_tokens.toLocaleString()} tokens</span></span>
        </div>
        {data.calls.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-txt-muted hover:text-txt-secondary">[ per-call log ]</summary>
            <div className="mt-2 max-h-48 overflow-y-auto border border-brd bg-bg-console">
              {data.calls.map((c, i) => (
                <div key={i} className="flex justify-between border-b border-brd px-3 py-1 last:border-0 text-txt-secondary">
                  <span className="text-txt-muted">[{c.ts.slice(11, 19)}]</span>
                  <span>{c.model}</span>
                  <span>p:{c.prompt_tokens ?? '-'} c:{c.completion_tokens ?? '-'}</span>
                  <span className="text-txt-muted">{c.duration?.toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </section>
  )
}

/** 报告查看器：JSON 渲染为发现卡片；Markdown 用 react-markdown；HTML 提供下载 */
function ReportSection({ taskId }: { taskId: string }) {
  const [tab, setTab] = useState('json')
  const { data: report, isLoading } = useQuery({
    queryKey: ['report', taskId],
    queryFn: () => getReportJSON(taskId),
    enabled: tab === 'json',
  })
  const { data: markdown } = useQuery({
    queryKey: ['report-md', taskId],
    queryFn: () => getReportMarkdown(taskId),
    enabled: tab === 'md',
  })

  return (
    <section>
      <SectionTitle label="report" />
      <div className="border border-brd bg-bg-card">
        <div className="flex items-center justify-between border-b border-brd px-3">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList>
              <TabsTrigger value="json">json_summary</TabsTrigger>
              <TabsTrigger value="md">markdown</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-3 pb-1 font-mono text-xs">
            {(['json', 'md', 'html'] as const).map((fmt) => (
              <a
                key={fmt}
                href={reportDownloadUrl(taskId, fmt)}
                download
                className="text-accent hover:underline"
              >
                [download {fmt}]
              </a>
            ))}
          </div>
        </div>
        <div className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsContent value="json">
              {isLoading ? (
                <p className="font-mono text-xs text-txt-muted">
                  loading<span className="cursor-blink" />
                </p>
              ) : report ? (
                <FindingsView report={report as ReportJSON} />
              ) : (
                <p className="font-mono text-xs text-txt-muted">failed to load report.</p>
              )}
            </TabsContent>
            <TabsContent value="md">
              <div className="md-body prose-sans max-h-[36rem] max-w-none overflow-y-auto text-sm leading-6">
                {markdown ? (
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                ) : (
                  <p className="font-mono text-xs text-txt-muted">
                    loading<span className="cursor-blink" />
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  )
}

/** 产物列表：排除 extracted/ 大目录后的文件清单，可逐个下载 */
function ArtifactsSection({ taskId, enabled }: { taskId: string; enabled: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ['artifacts', taskId],
    queryFn: () => getArtifacts(taskId),
    enabled,
  })

  return (
    <section>
      <SectionTitle label="artifacts" />
      <div className="border border-brd bg-bg-card">
        {isLoading ? (
          <p className="p-4 font-mono text-xs text-txt-muted">
            loading<span className="cursor-blink" />
          </p>
        ) : !data || data.artifacts.length === 0 ? (
          <p className="p-4 font-mono text-xs text-txt-muted">no artifacts yet.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto font-mono text-xs">
            {data.artifacts.map((a) => (
              <a
                key={a.path}
                href={artifactUrl(taskId, a.path)}
                className="flex items-center justify-between border-b border-brd px-3 py-1.5 last:border-0 hover:bg-bg-hover"
              >
                <span className="text-txt-secondary">{a.path}</span>
                <span className="flex shrink-0 items-center gap-3 text-txt-muted">
                  {formatBytes(a.size)}
                  <span className="text-accent">[get]</span>
                </span>
              </a>
            ))}
            {data.truncated && (
              <p className="px-3 py-2 text-txt-muted">showing first {data.artifacts.length} entries.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
