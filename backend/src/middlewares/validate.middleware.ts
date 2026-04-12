import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { sendError } from '../helpers/response.helper'

export const validateMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const details = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      sendError(res, 400, 'VALIDATION_ERROR', 'Données invalides', details)
      return
    }

    req.body = result.data
    next()
  }
}

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      const details = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      sendError(res, 400, 'VALIDATION_ERROR', 'Paramètres invalides', details)
      return
    }

    req.query = result.data as Record<string, string>
    next()
  }
}
