import { Router } from 'express'
import { contactController } from '../controllers/contact.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()

router.use(authMiddleware, tenantMiddleware)

// Routes spécifiques en premier (avant /:id)
router.post('/import', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.importContacts)
router.get('/export',  contactController.exportContacts)

router.get('/groups',     contactController.getGroups)
router.post('/groups',    rbacMiddleware(['client', 'admin', 'super_admin']), contactController.createGroup)
router.delete('/groups/:id', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.deleteGroup)

router.get('/lists',                   contactController.getLists)
router.post('/lists',                  rbacMiddleware(['client', 'admin', 'super_admin']), contactController.createList)
router.post('/lists/:id/add',          rbacMiddleware(['client', 'admin', 'super_admin']), contactController.addToList)
router.delete('/lists/:id/remove',     rbacMiddleware(['client', 'admin', 'super_admin']), contactController.removeFromList)

// Routes génériques (/:id après les routes spécifiques)
router.get('/',    contactController.getContacts)
router.post('/',   rbacMiddleware(['client', 'admin', 'super_admin']), contactController.createContact)
router.get('/:id', contactController.getContact)
router.put('/:id', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.updateContact)
router.delete('/:id', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.deleteContact)

export default router
