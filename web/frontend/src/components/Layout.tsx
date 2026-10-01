import { NavLink, Outlet } from 'react-router-dom'
import { useConfig } from '@/hooks/useConfig'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Tasks', cmd: 'tasks', end: true },
  { to: '/new', label: 'New Analysis', cmd: 'analyze', end: false },
  { to: '/settings', label: 'Settings', cmd: 'config', end: false },
]

/**
 * 终端风格全局布局：
 * - 顶部栏：FirmXplore v0.1.0 + provider 状态灯（● deterministic / ● provider-backed）
 * - 侧边栏：`$` 前缀命令式导航，激活项绿色
 * - 底部：user@firmxplore:~$ 提示符 + 闪烁光标
 */
export default function Layout() {
  const { data: config } = useConfig()
  const providerBacked = Boolean(config && !config.deterministic)

  return (
    <div className="scanlines flex min-h-screen flex-col">
      {/* 顶部栏 */}
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-brd bg-bg-secondary px-4 font-mono text-xs">
        <div className="tracking-widest">
          <span className="text-accent">FirmXplore</span>
          <span className="text-txt-muted"> v0.1.0</span>
          <span className="ml-3 text-txt-muted">firmware security analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn('inline-block h-2 w-2 rounded-full', providerBacked ? 'bg-success' : 'bg-txt-muted')}
          />
          <span className={providerBacked ? 'text-txt-primary' : 'text-txt-secondary'}>
            {providerBacked ? 'provider-backed' : 'deterministic'}
          </span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 侧边栏 */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-brd bg-bg-secondary font-mono text-xs">
          <nav className="flex-1 px-2 py-4">
            <div className="px-2 pb-2 text-txt-muted uppercase tracking-widest">menu</div>
            {navItems.map(({ to, label, cmd, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-baseline gap-2 px-2 py-1.5 transition-colors',
                    isActive ? 'text-accent' : 'text-txt-secondary hover:bg-bg-hover hover:text-txt-primary',
                  )
                }
              >
                <span className="text-txt-muted">$</span>
                <span className="tracking-wider">{cmd}</span>
                <span className="text-txt-muted">— {label}</span>
              </NavLink>
            ))}
          </nav>

          {/* 会话信息 */}
          <div className="border-t border-brd px-4 py-3 leading-5 text-txt-muted">
            {config && !config.deterministic && (
              <>
                <div>
                  provider: <span className="text-txt-secondary">{config.model_provider}</span>
                </div>
                <div>
                  model: <span className="text-txt-secondary">{config.model_name || 'default'}</span>
                </div>
                <div>
                  api_key:{' '}
                  <span className={config.api_key_set ? 'text-accent' : 'text-warning'}>
                    [{config.api_key_set ? 'configured' : 'not set'}]
                  </span>
                </div>
              </>
            )}
            {config?.deterministic && <div>mode: <span className="text-txt-secondary">deterministic</span></div>}
          </div>

          {/* 命令提示符 */}
          <div className="border-t border-brd px-4 py-3 text-txt-primary">
            <span className="text-accent">user@firmxplore</span>
            <span className="text-txt-secondary">:~$</span>
            <span className="cursor-blink" />
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-x-hidden px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
