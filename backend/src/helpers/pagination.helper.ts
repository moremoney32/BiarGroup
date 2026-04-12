import type { PaginationMeta, PaginationQuery } from '../types/api.types'

export const parsePagination = (query: PaginationQuery): { limit: number; offset: number; page: number } => {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export const buildMeta = (total: number, page: number, perPage: number): PaginationMeta => {
  return {
    page,
    perPage,
    total,
    lastPage: Math.ceil(total / perPage) || 1,
  }
}

export const buildOrderClause = (
  sortBy: string | undefined,
  order: 'asc' | 'desc' | undefined,
  allowedColumns: string[]
): string => {
  const col = allowedColumns.includes(sortBy ?? '') ? sortBy! : 'created_at'
  const dir = order === 'asc' ? 'ASC' : 'DESC'
  return `ORDER BY ${col} ${dir}`
}
