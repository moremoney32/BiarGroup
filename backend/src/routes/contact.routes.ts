import { Router } from 'express'
import multer from 'multer'
import { contactController } from '../controllers/contact.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()
const ALLOWED_MIMES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase()
    const ok = ALLOWED_MIMES.has(file.mimetype)
      || name.endsWith('.csv')
      || name.endsWith('.xlsx')
      || name.endsWith('.xls')
    cb(null, ok)
  },
})

router.use(authMiddleware, tenantMiddleware)

// Routes spécifiques en premier (avant /:id)
router.get('/fields', contactController.getCustomFieldKeys)
router.post('/import', rbacMiddleware(['client', 'admin', 'super_admin']), upload.single('file'), contactController.importContacts)
router.get('/export',  contactController.exportContacts)

router.get('/groups',     contactController.getGroups)
router.post('/groups',    rbacMiddleware(['client', 'admin', 'super_admin']), contactController.createGroup)
router.delete('/groups/:id', rbacMiddleware(['client', 'admin', 'super_admin']), contactController.deleteGroup)

router.get('/segments',              contactController.getSegments)
router.post('/segments',             rbacMiddleware(['client', 'admin', 'super_admin']), contactController.createSegment)
router.put('/segments/:id',          rbacMiddleware(['client', 'admin', 'super_admin']), contactController.updateSegment)
router.delete('/segments/:id',       rbacMiddleware(['client', 'admin', 'super_admin']), contactController.deleteSegment)
router.post('/segments/estimate',    rbacMiddleware(['client', 'admin', 'super_admin']), contactController.estimateCriteria)

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
