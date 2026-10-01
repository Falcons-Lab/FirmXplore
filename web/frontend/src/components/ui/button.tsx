import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'outline' | 'ghost' | 'destructive'
type Size = 'default' | 'sm' | 'lg'

const variants: Record<Variant, string> = {
  // 主操作：终端绿底 + 黑字
  default: 'bg-accent text-black border border-accent hover:bg-success/85',
  outline: 'border border-brd bg-bg-secondary text-txt-primary hover:border-accent hover:text-accent',
  ghost: 'text-txt-secondary hover:text-accent hover:bg-bg-hover',
  destructive: 'border border-error text-error hover:bg-error/10',
}

const sizes: Record<Size, string> = {
  default: 'h-8 px-3',
  sm: 'h-7 px-2 text-xs',
  lg: 'h-9 px-4',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider',
        'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
