/** 与后端 schemas.py 对应的类型定义 */
export type TaskStatus = 'pending' | 'running' | 'paused' | 'success' | 'failed'

export interface TaskInfo {
  id: string
  filename: string
  status: TaskStatus
  stage: string
  progress: number
  created_at: string
  updated_at: string
  config_json?: {
    model_provider?: string
    model_name?: string
    deterministic?: boolean
    options?: { static_only?: boolean; fast?: boolean; no_dynamic?: boolean; timeout?: number }
  } | null
  report_paths?: Record<string, string> | null
  error?: string | null
  duration_seconds?: number | null
  file_size?: number | null
}

export interface ConfigStatus {
  model_provider: string
  model_name: string
  base_url: string
  api_key_set: boolean
  deterministic: boolean
}

export interface ArtifactInfo {
  path: string
  size: number
  modified_at: string | null
}

/** SSE 推送的事件负载（对应后端 StreamEvent） */
export interface StreamEvent {
  task_id: string
  status: TaskStatus | string
  stage: string
  progress: number
  log_lines: string[]
  error: string | null
  timestamp: string
}

/** 组件关联拓扑图（对应后端 GraphResponse） */
export interface GraphNode {
  id: string
  name: string
  type: string
  path: string | null
  confidence: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  confidence: number
  static_or_dynamic: string
}

export interface GraphData {
  task_id: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  summary: Record<string, unknown>
}

/** 模型调用消耗（对应后端 /model-usage） */
export interface ModelUsageCall {
  ts: string
  provider: string
  model: string
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
  duration: number
}

export interface ModelUsage {
  task_id: string
  calls: ModelUsageCall[]
  totals: { prompt_tokens: number; completion_tokens: number; total_tokens: number; calls: number }
}

/** fwagent report.json 的关键部分（字段较多，只声明前端用到的） */
export interface ReportFinding {
  finding_id?: string
  title?: string
  status?: string
  confidence?: string
  category?: string
  severity_hint?: string
  summary?: string
  description?: string
  evidence_chain?: Record<string, unknown>
  [key: string]: unknown
}

export interface ReportJSON {
  schema_version?: string
  task_id?: string
  firmware?: Record<string, unknown>
  findings?: ReportFinding[]
  rejected_hypotheses?: unknown[]
  inconclusive_hypotheses?: unknown[]
  remaining_problems?: string[]
  validation_gaps?: string[]
  evidence_summary?: Record<string, unknown>
  provider_status?: Record<string, unknown>
  model_investigation?: Record<string, unknown> | null
  [key: string]: unknown
}
