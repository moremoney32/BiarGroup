import { Router } from 'express'
import { emailController } from '../controllers/email.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()

router.use(authMiddleware, tenantMiddleware)

router.get('/campaigns', emailController.getCampaigns)
router.get('/campaigns/:id', emailController.getCampaign)
router.post('/campaigns', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.createCampaign)
router.put('/campaigns/:id', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.updateCampaign)
router.delete('/campaigns/:id', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.deleteCampaign)
router.post('/campaigns/:id/send', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.sendCampaign)

router.get('/lists', emailController.getLists)
router.post('/lists', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.createList)

router.get('/templates', emailController.getTemplates)
router.post('/templates', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.createTemplate)

router.get('/smtp', rbacMiddleware(['admin', 'super_admin']), emailController.getSmtpConfigs)
router.post('/smtp', rbacMiddleware(['admin', 'super_admin']), emailController.createSmtpConfig)

export default router
