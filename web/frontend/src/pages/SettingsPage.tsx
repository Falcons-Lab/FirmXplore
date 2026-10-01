import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { useConfig, useSaveConfig } from '@/hooks/useConfig'

/** 设置页：.env 编辑器风格的 KEY=VALUE 配置表单。API Key 只写不读。 */
export default function SettingsPage() {
  const { data: config, isLoading } = useConfig()
  const saveConfig = useSaveConfig()

  const [deterministic, setDeterministic] = useState(true)
  const [modelProvider, setModelProvider] = useState('')
  const [modelName, setModelName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // 初次加载后把后端配置状态填进表单；API Key 永不回填，只显示 [ configured ]
  useEffect(() => {
    if (!config) return
    setDeterministic(config.deterministic)
    setModelProvider(config.model_provider === 'deterministic' ? '' : config.model_provider)
    setModelName(config.model_name)
    setBaseUrl(config.base_url)
  }, [config])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    saveConfig.mutate(
      {
        deterministic,
        model_provider: modelProvider,
        model_name: modelName,
        base_url: baseUrl,
        api_key: apiKey || (config?.api_key_set ? null : ''),
      },
      {
        onSuccess: () => setMessage({ kind: 'ok', text: 'config written.' }),
        onError: (err) => setMessage({ kind: 'err', text: err.message }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-mono text-sm uppercase tracking-widest">
        <span className="text-accent">##</span> <span className="text-txt-primary">settings — model provider</span>
      </h1>

      <Card>
        <CardHeader>
          <CardTitle># /etc/firmxplore/model.env</CardTitle>
          <CardDescription>
            model-driven investigation only. use deterministic mode to run fully offline without an api key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="font-mono text-xs text-txt-muted">
              reading config<span className="cursor-blink" />
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="flex items-center gap-2 border border-brd bg-bg-secondary px-3 py-2">
                <input
                  id="deterministic"
                  type="checkbox"
                  checked={deterministic}
                  onChange={(e) => setDeterministic(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#00ff41]"
                />
                <Label htmlFor="deterministic">DETERMINISTIC = true</Label>
                <span className="text-txt-muted"># no api key required</span>
              </div>

              <div className={deterministic ? 'pointer-events-none space-y-4 opacity-40' : 'space-y-4'}>
                <div>
                  <Label>MODEL_PROVIDER *</Label>
                  <Input
                    value={modelProvider}
                    onChange={(e) => setModelProvider(e.target.value)}
                    placeholder="e.g. deepseek / openai / anthropic"
                    className="mt-1.5"
                    required={!deterministic}
                  />
                </div>
                <div>
                  <Label>MODEL_NAME *</Label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="e.g. deepseek-chat"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>MODEL_BASE_URL *</Label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="required, e.g. https://api.deepseek.com"
                    className="mt-1.5"
                    required={!deterministic}
                  />
                </div>
                <div>
                  <Label>MODEL_API_KEY *</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={config?.api_key_set ? '[ configured ] — enter to overwrite' : '[ not set ]'}
                    className="mt-1.5"
                    autoComplete="new-password"
                    required={!deterministic && !config?.api_key_set}
                  />
                  <p className="mt-1 text-txt-muted">
                    # all four keys are required by fwagent, otherwise model investigation is skipped.
                    # key is fernet-encrypted server-side; never returned to the browser. empty keeps
                    # {config?.api_key_set ? 'the existing key.' : 'it unset.'}
                  </p>
                </div>
              </div>

              {message && (
                <p className={`border-l-2 px-2 py-1.5 ${message.kind === 'ok' ? 'border-accent bg-accent/5 text-accent' : 'border-error bg-error/5 text-error'}`}>
                  {message.kind === 'ok' ? '>> ' : '!! '}
                  {message.text}
                </p>
              )}
              <Button type="submit" disabled={saveConfig.isPending} className="w-full">
                {saveConfig.isPending ? '> writing...' : '> SAVE CONFIG'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
