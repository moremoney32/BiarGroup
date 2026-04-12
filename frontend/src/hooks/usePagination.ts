import { useState, useCallback } from 'react'
import type { PaginationQuery } from '../types/api.types'

interface UsePaginationReturn {
  params: PaginationQuery
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setLimit: (limit: number) => void
  setSortBy: (sortBy: string, order?: 'asc' | 'desc') => void
  reset: () => void
}

const DEFAULT_PARAMS: PaginationQuery = { page: 1, limit: 20, search: '', sortBy: 'createdAt', order: 'desc' }

export function usePagination(initial: PaginationQuery = {}): UsePaginationReturn {
  const [params, setParams] = useState<PaginationQuery>({ ...DEFAULT_PARAMS, ...initial })

  const setPage = useCallback((page: number) => setParams((p) => ({ ...p, page })), [])
  const setSearch = useCallback((search: string) => setParams((p) => ({ ...p, search, page: 1 })), [])
  const setLimit = useCallback((limit: number) => setParams((p) => ({ ...p, limit, page: 1 })), [])
  const setSortBy = useCallback(
    (sortBy: string, order: 'asc' | 'desc' = 'desc') => setParams((p) => ({ ...p, sortBy, order })),
    []
  )
  const reset = useCallback(() => setParams({ ...DEFAULT_PARAMS, ...initial }), [initial])

  return { params, setPage, setSearch, setLimit, setSortBy, reset }
}
