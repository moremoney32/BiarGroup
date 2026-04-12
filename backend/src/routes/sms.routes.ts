import { Router } from 'express'
import { smsController } from '../controllers/sms.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()

router.use(authMiddleware, tenantMiddleware)

router.get('/campaigns', smsController.getCampaigns)
router.get('/campaigns/:id', smsController.getCampaign)
router.post('/campaigns', rbacMiddleware(['client', 'admin', 'super_admin']), smsController.createCampaign)
router.put('/campaigns/:id', rbacMiddleware(['client', 'admin', 'super_admin']), smsController.updateCampaign)
router.delete('/campaigns/:id', rbacMiddleware(['client', 'admin', 'super_admin']), smsController.deleteCampaign)
router.post('/campaigns/:id/send', rbacMiddleware(['client', 'admin', 'super_admin']), smsController.sendCampaign)

router.get('/messages', smsController.getMessages)

router.get('/templates', smsController.getTemplates)
router.post('/templates', rbacMiddleware(['client', 'admin', 'super_admin']), smsController.createTemplate)

router.post('/otp/send', smsController.sendOtp)
router.post('/otp/verify', smsController.verifyOtp)

export default router
