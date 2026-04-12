export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
  meta?: PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown[]
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  lastPage: number
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

export interface PaginationQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}
