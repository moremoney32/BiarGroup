import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import { smsController } from '../controllers/sms.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

// Multer mémoire pour import CSV (pas de fichier sur disque)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'text/csv'
      || file.originalname.toLowerCase().endsWith('.csv')
      || file.mimetype === 'text/plain'
    cb(null, ok)
  },
})

const router = Router()

// ── Endpoints publics (sans auth) ────────────────────────────

// Redirect lien court — rate limited pour éviter DDoS
const redirectLimiter = rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: true, legacyHeaders: false })
router.get('/r/:code', redirectLimiter, smsController.redirectShortLink)

// Webhook DLR AfricasTalking — AT envoie un POST ici après livraison
// Pas d'auth JWT — vérifié par ?token=AT_DLR_SECRET dans le service
router.post('/dlr', smsController.handleDlr)

// Action Sender ID via lien email (approuver/rejeter) — pas d'auth, token JWT dans query
router.get('/sender-ids/action', smsController.senderIdAction)

// ── Toutes les routes suivantes requièrent auth + tenant ─────
router.use(authMiddleware, tenantMiddleware)

const clientAndUp = rbacMiddleware(['client', 'admin', 'super_admin'])
const adminAndUp  = rbacMiddleware(['admin', 'super_admin'])

// ── Envoi unique (SMS Simple) ────────────────────────────────
router.post('/send-single', clientAndUp, smsController.sendSingleSms)

// ── Campagnes ────────────────────────────────────────────────
router.get('/campaigns',          smsController.getCampaigns)
router.get('/campaigns/:id',      smsController.getCampaign)
router.post('/campaigns',         clientAndUp, smsController.createCampaign)
router.put('/campaigns/:id',      clientAndUp, smsController.updateCampaign)
router.delete('/campaigns/:id',   clientAndUp, smsController.deleteCampaign)
router.post('/campaigns/:id/send', clientAndUp, smsController.sendCampaign)

// ── Messages (logs individuels) ──────────────────────────────
router.get('/messages', smsController.getMessages)

// ── Templates ────────────────────────────────────────────────
router.get('/templates',        smsController.getTemplates)
router.post('/templates',       clientAndUp, smsController.createTemplate)
router.put('/templates/:id',    clientAndUp, smsController.updateTemplate)
router.delete('/templates/:id', clientAndUp, smsController.deleteTemplate)

// ── Sender IDs ───────────────────────────────────────────────
router.get('/sender-ids',                          smsController.getSenderIds)
router.post('/sender-ids',          clientAndUp,  smsController.createSenderId)
router.delete('/sender-ids/:id',    clientAndUp,  smsController.deleteSenderId)
// Approbation réservée aux admins (après validation AT côté BIAR GROUP)
router.post('/sender-ids/:id/approve', adminAndUp, smsController.approveSenderId)
router.post('/sender-ids/:id/reject',  adminAndUp, smsController.rejectSenderId)

// ── OTP ──────────────────────────────────────────────────────
// Rate limit strict : 5 req / 15 min / IP
const otpLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: true, legacyHeaders: false })
router.post('/otp/send',   otpLimiter, smsController.sendOtp)
router.post('/otp/verify', otpLimiter, smsController.verifyOtp)

// ── Messages Programmés ──────────────────────────────────────
router.get('/scheduled',         smsController.getScheduled)
router.post('/scheduled',        clientAndUp, smsController.createScheduled)
router.delete('/scheduled/:id',  clientAndUp, smsController.cancelScheduled)

// ── Listes de contacts SMS ───────────────────────────────────
router.get('/contact-lists',                     smsController.getContactLists)
router.post('/contact-lists',     clientAndUp,   smsController.createContactList)
router.delete('/contact-lists/:id', clientAndUp, smsController.deleteContactList)
router.get('/contact-lists/:id/contacts',        smsController.getContactsInList)
router.post('/contact-lists/:id/contacts', clientAndUp, smsController.addContactsToList)

// Import depuis le CRM global
router.get('/crm-contacts',                              smsController.getCrmContacts)
router.post('/contact-lists/:id/import-from-crm', clientAndUp, smsController.importFromCrm)
// Import CSV
router.post('/contact-lists/:id/import-csv', clientAndUp, csvUpload.single('file'), smsController.importContactsCsv)

// ── Réducteur d'URL (authentifié) ────────────────────────────
router.get('/links',           smsController.getShortLinks)
router.post('/links',          clientAndUp, smsController.createShortLink)
router.delete('/links/:id',    clientAndUp, smsController.deleteShortLink)
router.get('/links/:id/stats', smsController.getShortLinkStats)

// ── Analytics ────────────────────────────────────────────────
router.get('/analytics/overview', smsController.getOverviewStats)

// ── Clés API ─────────────────────────────────────────────────
router.get('/api-keys',        clientAndUp, smsController.getApiKeys)
router.post('/api-keys',       clientAndUp, smsController.createApiKey)
router.delete('/api-keys/:id', clientAndUp, smsController.deleteApiKey)

export default router
