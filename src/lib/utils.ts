import { clsx, type ClassValue } from 'clsx'
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ProjectStatus, TaskStatus, TaskPriority, RiskLevel } from './types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Formateo de fechas
export function formatDate(date: string | null) {
  if (!date) return '—'
  return format(new Date(date), 'dd/MM/yyyy', { locale: es })
}

export function formatDateFull(date: string | null) {
  if (!date) return '—'
  return format(new Date(date), "d 'de' MMMM yyyy", { locale: es })
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function isOverdue(date: string | null) {
  if (!date) return false
  return isPast(new Date(date))
}

export function daysUntil(date: string | null) {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

// Labels y colores para estados
export const projectStatusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  draft:       { label: 'Borrador',    color: 'text-surface-500', bg: 'bg-surface-100' },
  planning:    { label: 'Planificando', color: 'text-blue-700',   bg: 'bg-blue-50' },
  in_progress: { label: 'En Progreso', color: 'text-brand-700',  bg: 'bg-brand-50' },
  on_hold:     { label: 'En Pausa',    color: 'text-amber-700',  bg: 'bg-amber-50' },
  completed:   { label: 'Completado',  color: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled:   { label: 'Cancelado',   color: 'text-red-700',    bg: 'bg-red-50' },
}

export const taskStatusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pendiente',   color: 'text-surface-500', bg: 'bg-surface-100' },
  in_progress: { label: 'En Progreso', color: 'text-brand-700',  bg: 'bg-brand-50' },
  review:      { label: 'En Revisión', color: 'text-purple-700', bg: 'bg-purple-50' },
  completed:   { label: 'Completada',  color: 'text-emerald-700', bg: 'bg-emerald-50' },
  blocked:     { label: 'Bloqueada',   color: 'text-red-700',    bg: 'bg-red-50' },
}

export const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string; icon: string }> = {
  low:      { label: 'Baja',     color: 'text-surface-500', bg: 'bg-surface-100', icon: '↓' },
  medium:   { label: 'Media',    color: 'text-blue-700',   bg: 'bg-blue-50',    icon: '→' },
  high:     { label: 'Alta',     color: 'text-amber-700',  bg: 'bg-amber-50',   icon: '↑' },
  critical: { label: 'Crítica',  color: 'text-red-700',    bg: 'bg-red-50',     icon: '⚡' },
}

export const riskLevelConfig: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low:    { label: 'Bajo',    color: 'text-emerald-700', bg: 'bg-emerald-50' },
  medium: { label: 'Medio',   color: 'text-amber-700',  bg: 'bg-amber-50' },
  high:   { label: 'Alto',    color: 'text-red-700',    bg: 'bg-red-50' },
}

// Progreso a color del semáforo
export function getProgressColor(progress: number, hasOverdueTasks: boolean) {
  if (hasOverdueTasks) return 'text-red-500'
  if (progress >= 75) return 'text-emerald-500'
  if (progress >= 40) return 'text-amber-500'
  return 'text-brand-500'
}

export function getHealthStatus(progress: number, daysRemaining: number | null, overdueTasks: number) {
  if (overdueTasks > 0) return { label: 'En riesgo', color: 'bg-red-500' }
  if (daysRemaining !== null && daysRemaining < 7 && progress < 80) return { label: 'Atención', color: 'bg-amber-500' }
  return { label: 'En curso', color: 'bg-emerald-500' }
}
