import { Router } from 'express'
import { emailController } from '../controllers/email.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { rbacMiddleware } from '../middlewares/rbac.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'
import { mailerService } from '../services/mailer.service'

const router = Router()

// Route de test SMTP — pas de auth, juste pour vérifier la connexion Brevo
router.get('/test-smtp', async (_req, res) => {
  const ok = await mailerService.verify()
  if (ok) {
    res.json({ success: true, message: 'Connexion Brevo SMTP OK ✅' })
  } else {
    res.status(500).json({ success: false, message: 'Connexion Brevo SMTP échouée ❌' })
  }
})

// Route de test envoi réel — passe ton email en query ?to=tonemail@gmail.com
router.get('/test-send', async (req, res) => {
  const to = req.query.to as string
  if (!to) return res.status(400).json({ success: false, message: 'Paramètre ?to= manquant' })
  try {
    await mailerService.send({
      to,
      subject: 'Test BIAR GROUP — Nodemailer + Brevo',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
          <div style="background:#F4511E;padding:20px;border-radius:8px;text-align:center">
            <h1 style="color:white;margin:0">BIAR GROUP AFRICA</h1>
          </div>
          <p style="margin-top:20px">Bonjour,</p>
          <p>Ceci est un email de test envoyé via <strong>Nodemailer + Brevo</strong>.</p>
          <p>Si vous recevez cet email, la configuration SMTP est correcte ✅</p>
          <p style="color:#888;font-size:12px;margin-top:32px">BIAR GROUP AFRICA SARLU — Kinshasa, RDC</p>
        </div>
      `,
    })
    res.json({ success: true, message: `Email envoyé à ${to} ✅` })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    res.status(500).json({ success: false, message: msg })
  }
})

// Routes publiques (pas de auth) — appelées depuis les emails
router.get('/track/open/:messageId',  emailController.trackOpen)
router.get('/track/click/:messageId', emailController.trackClick)
router.get('/unsubscribe/:messageId', emailController.unsubscribe)

router.use(authMiddleware, tenantMiddleware)

router.get('/campaigns/stats', emailController.getStats)
router.get('/analytics/heatmap', emailController.getHeatmap)
router.get('/credits', emailController.getCredits)
router.get('/campaigns', emailController.getCampaigns)
router.get('/campaigns/:id', emailController.getCampaign)
router.delete('/campaigns/:id', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.deleteCampaign)
router.post('/campaigns/send', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.sendCampaign)

router.get('/lists', emailController.getLists)
router.post('/lists', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.createList)

router.get('/templates', emailController.getTemplates)
router.post('/templates', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.createTemplate)
router.delete('/templates/:id', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.deleteTemplate)

router.get('/smtp', rbacMiddleware(['admin', 'super_admin']), emailController.getSmtpConfigs)
router.post('/smtp', rbacMiddleware(['admin', 'super_admin']), emailController.createSmtpConfig)

router.get('/relances',     emailController.getRelances)
router.post('/relances',    rbacMiddleware(['client', 'admin', 'super_admin']), emailController.createRelance)
router.delete('/relances/:id', rbacMiddleware(['client', 'admin', 'super_admin']), emailController.cancelRelance)

export default router
