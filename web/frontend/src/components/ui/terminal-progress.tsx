/**
 * 终端进度条：STAGE_NAME [████████░░░░░░░░░░░░] 60% 120.4s
 * 块状字符渲染，等宽字体下天然对齐。
 */
const BAR_WIDTH = 20

export function TerminalProgress({
  stage,
  value,
  elapsed,
  className,
}: {
  stage: string
  value: number
  elapsed?: string
  className?: string
}) {
  const pct = Math.min(100, Math.max(0, value))
  const filled = Math.round((pct / 100) * BAR_WIDTH)
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)
  return (
    <div className={`font-mono text-xs leading-6 ${className ?? ''}`}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        {stage && <span className="uppercase tracking-wider text-accent">{stage}</span>}
        <span className={pct >= 100 ? 'text-accent' : 'text-txt-primary'}>
          [{bar}] {Math.round(pct)}%
        </span>
        {elapsed && <span className="text-txt-secondary">{elapsed}</span>}
      </div>
      {/* 可访问性：视觉隐藏的原生进度值 */}
      <div className="sr-only" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
    </div>
  )
}
