import { Router } from 'express'
import { callController } from '../controllers/call.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()

router.use(authMiddleware, tenantMiddleware)

router.get('/sessions', callController.getSessions)
router.get('/sessions/:id', callController.getSession)
router.post('/sessions/initiate', rbacMiddleware(['agent', 'admin', 'super_admin']), callController.initiateCall)
router.post('/sessions/:id/hangup', rbacMiddleware(['agent', 'admin', 'super_admin']), callController.hangupCall)

router.get('/agents', callController.getAgents)
router.patch('/agents/:id/status', rbacMiddleware(['agent', 'superviseur', 'admin', 'super_admin']), callController.updateAgentStatus)

router.get('/queues', callController.getQueues)

router.get('/svi', callController.getSviConfigs)
router.post('/svi', rbacMiddleware(['admin', 'super_admin']), callController.createSviConfig)

export default router
