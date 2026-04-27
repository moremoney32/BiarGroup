import { Router } from 'express'
import authRoutes from './auth.routes'
import callRoutes from './call.routes'
import smsRoutes from './sms.routes'
import emailRoutes from './email.routes'
import whatsappRoutes from './whatsapp.routes'
import contactRoutes from './contact.routes'
import reportRoutes from './report.routes'
import billingRoutes from './billing.routes'
import adminRoutes from './admin.routes'
import uploadRoutes from './upload.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/calls', callRoutes)
router.use('/sms', smsRoutes)
router.use('/email', emailRoutes)
router.use('/whatsapp', whatsappRoutes)
router.use('/contacts', contactRoutes)
router.use('/reports', reportRoutes)
router.use('/billing', billingRoutes)
router.use('/admin', adminRoutes)
router.use('/upload', uploadRoutes)

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.API_VERSION || 'v1' })
})

export default router
