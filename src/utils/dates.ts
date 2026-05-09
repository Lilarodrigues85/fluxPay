import { format, isAfter, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateLong(timestamp: number): string {
  return format(new Date(timestamp), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatMonth(timestamp: number): string {
  return format(new Date(timestamp), 'MMM/yyyy', { locale: ptBR })
}

export function isOverdue(dueDate: number, status: string): boolean {
  return status === 'pending' && isAfter(new Date(), new Date(dueDate))
}

export function getMonthRange(date = new Date(), startDay = 1): { start: number; end: number } {
  if (startDay <= 1) {
    return {
      start: startOfMonth(date).getTime(),
      end: endOfMonth(date).getTime(),
    }
  }
  const safeDay = Math.max(1, Math.min(28, Math.floor(startDay)))
  const day = date.getDate()
  const startMonth = day >= safeDay
    ? new Date(date.getFullYear(), date.getMonth(), safeDay, 0, 0, 0, 0)
    : new Date(date.getFullYear(), date.getMonth() - 1, safeDay, 0, 0, 0, 0)
  const end = new Date(startMonth)
  end.setMonth(end.getMonth() + 1)
  end.setMilliseconds(-1)
  return { start: startMonth.getTime(), end: end.getTime() }
}

export function getLastNMonths(n: number): Date[] {
  const months: Date[] = []
  for (let i = n - 1; i >= 0; i--) {
    months.push(subMonths(new Date(), i))
  }
  return months
}

export function getNextNMonths(n: number): Date[] {
  const months: Date[] = []
  for (let i = 0; i < n; i++) {
    months.push(addMonths(new Date(), i))
  }
  return months
}

export function endOfNthMonthAhead(n: number): number {
  return endOfMonth(addMonths(new Date(), n - 1)).getTime()
}

export function dateToInputValue(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd')
}

export function inputValueToTimestamp(value: string): number {
  return new Date(value + 'T12:00:00').getTime()
}
