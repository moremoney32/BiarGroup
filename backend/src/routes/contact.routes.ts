import { Router } from 'express'
import { contactController } from '../controllers/contact.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()

router.use(authMiddleware, tenantMiddleware)

router.get('/', contactController.getContacts)
router.get('/:id', contactController.getContact)
router.post('/', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.createContact)
router.put('/:id', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.updateContact)
router.delete('/:id', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.deleteContact)
router.post('/import', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.importContacts)
router.get('/export', contactController.exportContacts)

router.get('/lists', contactController.getLists)
router.post('/lists', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.createList)
router.post('/lists/:id/add', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.addToList)
router.delete('/lists/:id/remove', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.removeFromList)

export default router
