import { Router } from 'express'
import { whatsappController } from '../controllers/whatsapp.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()

// WA webhook — pas d'auth (signature vérifiée dans le controller)
router.get('/webhook', whatsappController.webhook)
router.post('/webhook', whatsappController.webhook)

router.use(authMiddleware, tenantMiddleware)

router.get('/campaigns', whatsappController.getCampaigns)
router.get('/campaigns/:id', whatsappController.getCampaign)
router.post('/campaigns', rbacMiddleware(['client', 'admin', 'super_admin']), whatsappController.createCampaign)
router.put('/campaigns/:id', rbacMiddleware(['client', 'admin', 'super_admin']), whatsappController.updateCampaign)
router.delete('/campaigns/:id', rbacMiddleware(['client', 'admin', 'super_admin']), whatsappController.deleteCampaign)
router.post('/campaigns/:id/send', rbacMiddleware(['client', 'admin', 'super_admin']), whatsappController.sendCampaign)

router.get('/templates', whatsappController.getTemplates)
router.post('/templates', rbacMiddleware(['admin', 'super_admin']), whatsappController.createTemplate)

router.get('/contacts', whatsappController.getContacts)

export default router
