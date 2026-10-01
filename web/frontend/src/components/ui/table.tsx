import * as React from 'react'
import { cn } from '@/lib/utils'

/** htop 风格表格：直角、单像素边框、等宽字距 */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full border border-brd bg-bg-card">
      <table className={cn('w-full caption-bottom font-mono text-xs', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        '[&_th]:h-8 [&_th]:px-3 [&_th]:text-left [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-widest [&_th]:text-txt-muted [&_th]:border-b [&_th]:border-brd',
        className,
      )}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('border-b border-brd transition-colors hover:bg-bg-hover', className)} {...props} />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-3 py-2 align-middle', className)} {...props} />
}
