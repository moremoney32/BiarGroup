import { Response } from 'express'
import type { PaginationMeta } from '../types/api.types'

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Opération réussie',
  statusCode = 200,
  meta?: PaginationMeta
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
    ...(meta ? { meta } : {}),
  })
}

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown[]
): void => {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  })
}
