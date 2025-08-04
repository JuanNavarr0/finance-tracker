import { format, parseISO, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx, { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combine class names with tailwind merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format percentage
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Format number with separators
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Date formatting
export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return format(parsedDate, formatStr, { locale: es })
}

export function formatDateTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return format(parsedDate, 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatRelativeDate(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  if (isToday(parsedDate)) {
    return 'Hoy'
  }
  
  if (isYesterday(parsedDate)) {
    return 'Ayer'
  }
  
  return formatDistanceToNow(parsedDate, { 
    addSuffix: true, 
    locale: es 
  })
}

// Category labels
export const INCOME_TYPE_LABELS: Record<string, string> = {
  salary: 'Salario',
  freelance: 'Freelance',
  investment: 'Inversión',
  rental: 'Alquiler',
  business: 'Negocio',
  gift: 'Regalo',
  other: 'Otro',
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  housing: 'Vivienda',
  utilities: 'Servicios',
  transportation: 'Transporte',
  groceries: 'Supermercado',
  insurance: 'Seguros',
  food: 'Comida',
  entertainment: 'Entretenimiento',
  clothing: 'Ropa',
  health: 'Salud',
  education: 'Educación',
  personal: 'Personal',
  gifts: 'Regalos',
  travel: 'Viajes',
  shopping: 'Compras',
  other: 'Otro',
}

export const EXPENSE_FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'Único',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

export const GOAL_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  completed: 'Completado',
  paused: 'Pausado',
  cancelled: 'Cancelado',
}

export const GOAL_PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  stock: 'Acción',
  etf: 'ETF',
  mutual_fund: 'Fondo Mutuo',
  bond: 'Bono',
  crypto: 'Cripto',
  real_estate: 'Inmueble',
  commodity: 'Commodity',
  other: 'Otro',
}

export const INVESTMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  sold: 'Vendida',
  partial_sold: 'Vendida Parcial',
}

// Category colors
export const CATEGORY_COLORS: Record<string, string> = {
  // Income colors
  salary: '#3b82f6',
  freelance: '#8b5cf6',
  investment: '#10b981',
  rental: '#f59e0b',
  business: '#06b6d4',
  gift: '#ec4899',
  
  // Expense colors
  housing: '#ef4444',
  utilities: '#f97316',
  transportation: '#eab308',
  groceries: '#84cc16',
  insurance: '#22c55e',
  food: '#14b8a6',
  entertainment: '#06b6d4',
  clothing: '#3b82f6',
  health: '#6366f1',
  education: '#8b5cf6',
  personal: '#a855f7',
  gifts: '#d946ef',
  travel: '#ec4899',
  shopping: '#f43f5e',
  other: '#6b7280',
}

// Goal priority colors
export const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
}

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  completed: '#3b82f6',
  paused: '#f59e0b',
  cancelled: '#ef4444',
  sold: '#6b7280',
  partial_sold: '#f59e0b',
}

// Calculate percentage change
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

// Get month name
export function getMonthName(month: number): string {
  const date = new Date()
  date.setMonth(month - 1)
  return format(date, 'MMMM', { locale: es })
}

// Get default date range (current month)
export function getDefaultDateRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return {
    start_date: format(firstDay, 'yyyy-MM-dd'),
    end_date: format(lastDay, 'yyyy-MM-dd')
  }
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Group items by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

// Sleep function for testing loading states
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Check if value is empty
export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Generate random color
export function generateColor(seed: string): string {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'
  ]
  
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}