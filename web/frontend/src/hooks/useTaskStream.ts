import { useEffect, useRef, useState } from 'react'
import type { LogLine } from '@/components/LogConsole'
import type { StreamEvent } from '@/types'

/**
 * 订阅任务的 SSE 状态流。
 * 浏览器 EventSource 断线后会自动重连；组件卸载时关闭连接。
 * 返回：
 * - event：最新状态事件（SSE 里只带最近的日志片段，合并去重后保留最近 500 行）
 * - logs：累积日志行
 * - graphVersion：每当拓扑图数据更新（收到 graph 事件）时自增，
 *   页面据此立即重新拉取拓扑图，实现图的实时刷新
 */
export function useTaskStream(taskId: string | undefined) {
  const [event, setEvent] = useState<StreamEvent | null>(null)
  const [logs, setLogs] = useState<LogLine[]>([])
  const [graphVersion, setGraphVersion] = useState(0)
  const seenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!taskId) return
    // 重置状态，避免上一个任务的日志串场
    setEvent(null)
    setLogs([])
    setGraphVersion(0)
    seenRef.current = new Set()

    const source = new EventSource(`/api/tasks/${taskId}/stream`)
    source.addEventListener('status', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as StreamEvent
        setEvent(data)
        if (data.log_lines?.length) {
          setLogs((prev) => {
            const merged = [...prev]
            for (const line of data.log_lines) {
              if (!seenRef.current.has(line)) {
                seenRef.current.add(line)
                merged.push({ text: line, ts: new Date().toLocaleTimeString('en-GB') })
              }
            }
            return merged.slice(-500)
          })
        }
      } catch {
        /* 忽略无法解析的事件 */
      }
    })
    source.addEventListener('graph', () => {
      // 拓扑图数据有变化：只递增版本号，由页面触发重新拉取
      setGraphVersion((v) => v + 1)
    })
    return () => source.close()
  }, [taskId])

  return { event, logs, graphVersion }
}
