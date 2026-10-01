import { Badge } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportFinding, ReportJSON } from '@/types'

/** 严重程度 -> 终端配色（暗底 + 高对比文字） */
const severityColors: Record<string, string> = {
  critical: 'border border-error bg-error/10 text-error',
  high: 'border border-[#ff6600] bg-[#ff6600]/10 text-[#ff6600]',
  medium: 'border border-warning bg-warning/10 text-warning',
  low: 'border border-txt-secondary bg-bg-secondary text-txt-secondary',
  info: 'border border-txt-muted bg-bg-secondary text-txt-muted',
}

/** JSON 报告渲染器：findings 卡片 + 关键摘要（fwagent report.json 结构） */
export function FindingsView({ report }: { report: ReportJSON }) {
  const findings = report.findings ?? []
  const firmware = (report.firmware ?? {}) as Record<string, unknown>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="FINDINGS" value={findings.length} />
        <StatCard label="REJECTED HYPOTHESES" value={report.rejected_hypotheses?.length ?? 0} />
        <StatCard label="INCONCLUSIVE" value={report.inconclusive_hypotheses?.length ?? 0} />
        <StatCard label="TARGET ARCH" value={String(firmware.architecture ?? firmware.target_arch ?? '-')} />
      </div>

      {report.model_investigation && (report.model_investigation as Record<string, unknown>).steps != null && (
        <div className="border border-brd bg-bg-secondary p-3 font-mono text-xs text-txt-secondary">
          <span className="text-accent">## model investigation</span>{' '}
          {(report.model_investigation as Record<string, unknown>).provider as string} /
          {(report.model_investigation as Record<string, unknown>).model as string}
          {' — steps: '}
          <span className="text-txt-primary">{String((report.model_investigation as Record<string, unknown>).steps)}</span>
          {', stop_reason: '}
          {String((report.model_investigation as Record<string, unknown>).stop_reason)}
          {', evidence: '}
          {String((report.model_investigation as Record<string, unknown>).evidence_produced)}
          {', hypotheses: '}
          {String((report.model_investigation as Record<string, unknown>).hypotheses_produced)}
          {(report.model_investigation as Record<string, unknown>).degraded
            ? ' — degraded mode (no Ghidra tools)'
            : ''}
        </div>
      )}

      {findings.length === 0 ? (
        <p className="border border-dashed border-brd p-8 text-center font-mono text-xs text-txt-muted">
          0 findings in this report.
        </p>
      ) : (
        findings.map((f, i) => <FindingCard key={f.finding_id ?? i} finding={f} />)
      )}

      {report.remaining_problems && report.remaining_problems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle># remaining problems</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 font-mono text-xs text-txt-secondary">
              {report.remaining_problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-brd bg-bg-secondary p-3">
      <div className="font-mono text-xl font-semibold text-accent">{value}</div>
      <div className="mt-1 font-mono text-xs uppercase tracking-widest text-txt-muted">{label}</div>
    </div>
  )
}

function FindingCard({ finding }: { finding: ReportFinding }) {
  const severity = String(finding.severity_hint ?? 'info').toLowerCase()
  const chain = finding.evidence_chain
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-txt-primary">
            {finding.finding_id ? <span className="mr-2 text-txt-muted">{finding.finding_id}</span> : null}
            {finding.title ?? 'UNNAMED FINDING'}
          </CardTitle>
          <Badge className={severityColors[severity] ?? severityColors.info}>{severity.toUpperCase()}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs text-txt-muted">
          {finding.status && <span>status: {finding.status}</span>}
          {finding.confidence && <span>· confidence: {finding.confidence}</span>}
          {finding.category && <span>· category: {finding.category}</span>}
        </div>
      </CardHeader>
      {(finding.summary || finding.description) && (
        <CardContent className="prose-sans pb-4 text-sm text-txt-secondary">
          {finding.summary ?? finding.description}
        </CardContent>
      )}
      {chain && Object.keys(chain).length > 0 && (
        <CardContent className="border-t border-brd pt-3">
          <details>
            <summary className="cursor-pointer font-mono text-xs text-txt-secondary hover:text-accent">
              [ evidence chain ]
            </summary>
            <pre className="mt-2 max-h-60 overflow-auto border border-brd bg-bg-console p-3 font-mono text-xs text-txt-secondary">
              {JSON.stringify(chain, null, 2)}
            </pre>
          </details>
        </CardContent>
      )}
    </Card>
  )
}
