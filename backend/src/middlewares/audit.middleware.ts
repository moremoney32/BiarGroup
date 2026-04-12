import { Request, Response, NextFunction } from 'express'
import { pool } from '../db/config'

const SENSITIVE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

// Log toutes les actions sensibles — audit trail gouvernement
export const auditMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!SENSITIVE_METHODS.includes(req.method)) {
    next()
    return
  }

  const userId = req.user?.id ?? null
  const tenantId = req.user?.tenantId ?? null
  const action = `${req.method} ${req.path}`
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
  const meta = JSON.stringify({
    body: req.body,
    params: req.params,
    query: req.query,
  })

  // Fire and forget — ne pas bloquer la requête
  pool.execute(
    'INSERT INTO audit_logs (user_id, tenant_id, action, ip_address, meta, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [userId, tenantId, action, ip, meta]
  ).catch((err) => {
    console.error('Audit log failed:', err)
  })

  next()
}
