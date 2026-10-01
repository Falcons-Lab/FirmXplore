import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(1)} ${units[i]}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '-'
  if (seconds < 60) return `${seconds.toFixed(0)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m < 60) return `${m}m ${s}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

/** 旧任务记录里可能存有中文 stage 文案，显示时统一映射为英文 */
const stageEn: Record<string, string> = {
  '排队中': 'queued',
  '任务创建': 'task create',
  '固件提取与静态分析': 'static analysis',
  '关联分析与假设构建': 'correlation & hypotheses',
  '调查与动态验证': 'investigation',
  '整理安全发现': 'finalizing findings',
  '生成报告': 'report generation',
  '完成': 'completed',
  '失败': 'failed',
  '已暂停（可恢复）': 'paused (resumable)',
  '恢复分析中': 'resuming',
}

export function displayStage(stage: string): string {
  return stageEn[stage] ?? stage
}
