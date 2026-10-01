import type {
  ArtifactInfo,
  ConfigStatus,
  GraphData,
  ModelUsage,
  ReportJSON,
  TaskInfo,
} from '@/types'

/** 统一的 fetch 封装：JSON 解析 + 错误信息提取 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail ?? JSON.stringify(body)
    } catch {
      /* 非 JSON 错误体 */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

export function getConfig() {
  return request<ConfigStatus>('/api/config')
}

export function saveConfig(body: {
  model_provider: string
  model_name: string
  base_url: string
  api_key: string | null
  deterministic: boolean
}) {
  return request<ConfigStatus>('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// 任务
// ---------------------------------------------------------------------------

export function listTasks(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request<TaskInfo[]>(`/api/tasks${query}`)
}

export function getTask(id: string) {
  return request<TaskInfo>(`/api/tasks/${id}`)
}

export function deleteTask(id: string) {
  return request<{ deleted: string }>(`/api/tasks/${id}`, { method: 'DELETE' })
}

/** 暂停任务：终止分析子进程，保留工作区，可用 resume 续跑 */
export function stopTask(id: string) {
  return request<{ stopped: string }>(`/api/tasks/${id}/stop`, { method: 'POST' })
}

/** 恢复已暂停的任务（fwagent analyze(resume=True)） */
export function resumeTask(id: string) {
  return request<{ resumed: string }>(`/api/tasks/${id}/resume`, { method: 'POST' })
}

/**
 * 上传固件并启动分析。
 * FormData 交给浏览器自动设置 multipart boundary，不要手动设置 Content-Type。
 */
export function startAnalysis(file: File, options: FormData) {
  const body = new FormData()
  body.append('file', file)
  for (const [key, value] of options.entries()) body.append(key, value)
  return request<{ task_id: string }>('/api/analyze', { method: 'POST', body })
}

// ---------------------------------------------------------------------------
// 报告与产物
// ---------------------------------------------------------------------------

export function getReportJSON(id: string) {
  return request<ReportJSON>(`/api/tasks/${id}/report?format=json`)
}

export function getReportMarkdown(id: string) {
  return request<string>(`/api/tasks/${id}/report?format=md`).catch(() => null)
}

export function getArtifacts(id: string) {
  return request<{ task_id: string; artifacts: ArtifactInfo[]; truncated: boolean }>(
    `/api/tasks/${id}/artifacts`,
  )
}

/** 组件关联拓扑图（correlation 阶段产物，未生成时抛错） */
export function getGraph(id: string) {
  return request<GraphData>(`/api/tasks/${id}/graph`)
}

/** 模型调用 token 消耗（web_model_usage.jsonl 汇总，未调用时 totals.calls=0） */
export function getModelUsage(id: string) {
  return request<ModelUsage>(`/api/tasks/${id}/model-usage`)
}

/** 产物/报告的下载地址（浏览器直接打开即下载） */
export function artifactUrl(id: string, path: string) {
  return `/api/tasks/${id}/artifacts/${path}`
}

export function reportDownloadUrl(id: string, format: 'json' | 'md' | 'html') {
  return `/api/tasks/${id}/report?format=${format}`
}
