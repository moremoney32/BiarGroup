import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'
import { billingService } from '../services/billing.service'
import { sendSuccess } from '../helpers/response.helper'

const router = Router()

// Stripe webhook — raw body needed
router.post('/webhook/stripe', (req, res) => {
  // TODO: implement stripe webhook
  res.json({ received: true })
})

router.use(authMiddleware, tenantMiddleware)

router.get('/plans', async (_req, res) => {
  const plans = await billingService.getPlans()
  sendSuccess(res, plans)
})

router.get('/subscription', async (req, res) => {
  // TODO: implement
})

router.post('/subscription', rbacMiddleware(['admin', 'super_admin']), async (req, res) => {
  // TODO: implement
})

router.delete('/subscription', rbacMiddleware(['admin', 'super_admin']), async (req, res) => {
  // TODO: implement
})

router.get('/invoices', async (req, res) => {
  // TODO: implement
})

export default router
