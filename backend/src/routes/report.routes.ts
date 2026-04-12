import { Router } from 'express'
import { reportController } from '../controllers/report.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()

router.use(authMiddleware, tenantMiddleware)

router.get('/dashboard', reportController.getDashboardStats)
router.get('/calls', reportController.getCallReport)
router.get('/sms', reportController.getSmsReport)
router.get('/email', reportController.getEmailReport)
router.get('/whatsapp', reportController.getWhatsappReport)
router.get('/export', reportController.exportReport)
router.get('/audit', rbacMiddleware(['admin', 'super_admin']), reportController.getAuditLogs)

export default router
