import * as React from 'react'
import { cn } from '@/lib/utils'

/** 终端风格 Tabs：下划线指示，激活项绿色 */
interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string
  onValueChange: (v: string) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex h-8 items-stretch gap-0 border-b border-brd font-mono text-xs uppercase tracking-widest', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ value, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx?.value === value
  return (
    <button
      onClick={() => ctx?.setValue(value)}
      className={cn(
        'inline-flex items-center px-3 transition-colors',
        'border-b-2 -mb-px',
        active
          ? 'border-accent text-accent'
          : 'border-transparent text-txt-secondary hover:text-txt-primary',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ value, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = React.useContext(TabsContext)
  if (ctx?.value !== value) return null
  return <div className={cn('mt-3', className)} {...props} />
}
