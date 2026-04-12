import { Router } from 'express'
import { adminController } from '../controllers/admin.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'

const router = Router()

// super_admin only
router.use(authMiddleware, rbacMiddleware(['super_admin']))

router.get('/tenants', adminController.getTenants)
router.get('/tenants/:id', adminController.getTenant)
router.post('/tenants', adminController.createTenant)
router.put('/tenants/:id', adminController.updateTenant)
router.patch('/tenants/:id/suspend', adminController.suspendTenant)

router.get('/users', adminController.getUsers)
router.put('/users/:id', adminController.updateUser)

router.get('/stats', adminController.getSystemStats)

router.get('/api-keys', adminController.getApiKeys)
router.delete('/api-keys/:id', adminController.revokeApiKey)

export default router
