import * as React from 'react'
import { cn } from '@/lib/utils'

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center font-mono text-xs', className)} {...props} />
}

const fieldBase =
  'font-mono text-xs bg-bg-secondary text-txt-primary border border-brd placeholder:text-txt-muted ' +
  'focus:outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-40'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, 'h-8 w-full px-2', className)} {...props} />
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('font-mono text-xs font-medium uppercase tracking-wider text-txt-secondary', className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-[60px] w-full px-2 py-1.5', className)} {...props} />
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, 'h-8 w-full px-2', className)} {...props} />
}
