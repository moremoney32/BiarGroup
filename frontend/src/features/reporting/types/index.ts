export interface ReportFilter {
  from: string
  to: string
  module: 'calls' | 'sms' | 'email' | 'whatsapp' | 'all'
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}
