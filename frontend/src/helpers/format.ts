import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatDate = (date: string | Date, pattern = 'dd/MM/yyyy HH:mm'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: fr })
}

export const formatRelative = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

// Numéros téléphone RDC (+243)
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('243') && cleaned.length === 12) {
    return `+243 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  return phone
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 o'
  const units = ['o', 'Ko', 'Mo', 'Go']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('fr-FR').format(n)

export const formatPercent = (value: number, total: number): string => {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
