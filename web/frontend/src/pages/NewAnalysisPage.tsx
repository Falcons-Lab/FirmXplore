import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label, Select } from '@/components/ui/input'
import { useConfig } from '@/hooks/useConfig'
import { startAnalysis } from '@/api/client'

/** 新建分析页：终端式上传区 + 可折叠配置（默认使用设置页保存的配置） */
export default function NewAnalysisPage() {
  const navigate = useNavigate()
  const { data: config } = useConfig()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'normal' | 'static_only' | 'fast'>('normal')
  const [timeoutSec, setTimeoutSec] = useState(600)

  const providerConfigured = !config || config.deterministic || config.api_key_set

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setFile(e.target.files?.[0] ?? null)
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('select a firmware file first')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('use_saved_config', 'true')
      form.append('static_only', String(mode === 'static_only'))
      form.append('fast', String(mode === 'fast'))
      form.append('no_dynamic', String(mode !== 'normal'))
      form.append('timeout', String(timeoutSec))
      const { task_id } = await startAnalysis(file, form)
      navigate(`/tasks/${task_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-mono text-sm uppercase tracking-widest">
        <span className="text-accent">##</span> <span className="text-txt-primary">new analysis</span>
      </h1>

      <Card>
        <CardHeader>
          <CardTitle># upload firmware</CardTitle>
          <CardDescription>
            .bin / .img / .zip / .tar / .squashfs ... max 1GB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              setFile(e.dataTransfer.files?.[0] ?? null)
            }}
            className="flex w-full flex-col items-center justify-center gap-1 border border-dashed border-brd p-10 font-mono text-xs text-txt-secondary transition-colors hover:border-accent hover:text-accent"
          >
            {file ? (
              <>
                <span className="text-txt-primary">{file.name}</span>
                <span className="text-txt-muted">{(file.size / 1024 / 1024).toFixed(1)} MB — [ change ]</span>
              </>
            ) : (
              <>
                <span>[ drag &amp; drop firmware.bin, or browse ]</span>
                <span className="text-txt-muted">awaiting input</span>
              </>
            )}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <button className="flex w-full items-center justify-between text-left" onClick={() => setShowConfig((v) => !v)}>
            <div>
              <CardTitle># analysis config</CardTitle>
              <CardDescription>
                {config?.deterministic
                  ? 'using saved config — deterministic mode (no api key required)'
                  : config
                    ? `using saved config — ${config.model_provider}${config.api_key_set ? '' : ' (api key not set)'}`
                    : 'loading saved config...'}
              </CardDescription>
            </div>
            <span className="font-mono text-xs text-txt-muted">{showConfig ? '[-]' : '[+]'}</span>
          </button>
        </CardHeader>
        {showConfig && (
          <CardContent className="space-y-3 border-t border-brd">
            <p className="font-mono text-xs text-txt-muted">
              provider / api key are managed on the <a href="/settings" className="text-accent hover:underline">$ config</a> page.
              the api key never leaves the server.
            </p>
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <Label>PROVIDER</Label>
                <Input value={config?.model_provider ?? ''} disabled className="mt-1.5" />
              </div>
              <div>
                <Label>MODEL</Label>
                <Input value={config?.model_name ?? ''} placeholder="(default)" disabled className="mt-1.5" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle># run options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 font-mono">
            <div>
              <Label>ANALYSIS MODE</Label>
              <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="mt-1.5">
                <option value="normal">full (static + dynamic)</option>
                <option value="static_only">static-only (skip dynamic)</option>
                <option value="fast">fast triage</option>
              </Select>
            </div>
            <div>
              <Label>EXTRACTION TIMEOUT (S)</Label>
              <Input
                type="number"
                min={60}
                max={7200}
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
          </div>
          {!providerConfigured && (
            <p className="border-l-2 border-warning bg-warning/5 px-2 py-1.5 font-mono text-xs text-warning">
              warning: provider has no api key. model-driven investigation will be skipped; deterministic
              analysis still runs. configure under $ config.
            </p>
          )}
          <p className="font-mono text-xs text-txt-muted">
            {config && !config.deterministic && config.api_key_set
              ? 'model configured: PiAgent investigation runs after deterministic analysis (consumes api quota).'
              : 'deterministic mode: no api calls, no quota consumption.'}
          </p>
          {error && (
            <p className="border-l-2 border-error bg-error/5 px-2 py-1.5 font-mono text-xs text-error">error: {error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || !file}
            className="h-9 w-full border border-accent bg-accent font-mono text-xs font-medium uppercase tracking-widest text-black transition-colors hover:bg-success/85 disabled:pointer-events-none disabled:opacity-40"
          >
            {submitting ? '$ firmxplore analyze --running' : '$ firmxplore analyze'}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
