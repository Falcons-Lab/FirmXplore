import { useEffect, useRef } from 'react'

/**
 * 终端模拟器风格日志：背景 #0d0d0d，每行前缀到达时间戳，级别着色。
 * 时间戳由 useTaskStream 在日志行到达时打点，渲染时不会漂移。
 */
export interface LogLine {
  text: string
  ts: string
}

function lineColor(line: string): string {
  const upper = line.toUpperCase()
  if (upper.includes('ERROR') || upper.includes('TRACEBACK') || upper.includes('ANALYSIS_CRASHED')) {
    return 'text-error'
  }
  if (upper.includes('WARN')) return 'text-warning'
  if (line.includes('[model]')) return 'text-accent'
  if (line.includes('[cmd]')) return 'text-txt-muted'
  return 'text-txt-secondary'
}

export function LogConsole({ lines }: { lines: LogLine[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines.length])

  return (
    <div className="max-h-80 overflow-y-auto border border-brd bg-bg-console p-3 font-mono text-xs leading-5">
      {lines.length === 0 ? (
        <p className="text-txt-muted">
          waiting for analysis output<span className="cursor-blink" />
        </p>
      ) : (
        lines.map((entry, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            <span className="mr-2 select-none text-txt-muted">[{entry.ts}]</span>
            <span className={lineColor(entry.text)}>{entry.text}</span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
