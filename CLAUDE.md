# CLAUDE.md — BIAR GROUP AFRICA | Actor Hub CPaaS Platform
> Fichier de contexte permanent. Relis ce fichier INTÉGRALEMENT avant chaque tâche.
> Projet : Plateforme CPaaS SaaS multi-tenant — B-GOTOCALL | B-SMSBULK | B-EMAIL | B-WHATSAPP
> Client : BIAR GROUP AFRICA SARLU — Kinshasa, République Démocratique du Congo
> Contexte : Plateforme gouvernementale & entreprises. Sécurité MAXIMALE. Zéro tolérance failles.

---

## 0. RÈGLES ABSOLUES — FIGMA API

> ⛔ NE PAS appeler l'API Figma plus de 2 fois par session.
> L'API Figma retourne 429 (rate limit) très rapidement et CASSE les tokens.
> STRATÉGIE OBLIGATOIRE pour le design :
> 1. Lire les screenshots/assets déjà dans `frontend/src/assets/` avec le tool Read (lecture visuelle)
> 2. Utiliser les fichiers `slide1_188-2.png` à `slide5_188-2826.png` comme référence Figma
> 3. Utiliser les fichiers `Section.png` à `Section (4).png` comme backgrounds hero
> 4. Utiliser `two.png` → `six.png` comme screenshots du rendu actuel à comparer
> 5. Reconstruire pixel-perfect en comparant visuellement — JAMAIS via appels API Figma répétés

---

## 1. VISION PRODUIT

Plateforme tout-en-un de communication digitale (CPaaS/SaaS) composée de 4 modules :

| Module | Nom commercial | Description |
|---|---|---|
| Call Center Cloud | B-GOTOCALL | VoIP, SIP, SVI, ACD, CTI, WebRTC, Power Dialer, IA |
| SMS Bulk | B-SMSBULK | Envoi masse, SMPP, OTP, USSD, Chatbot Builder |
| Email Marketing | B-EMAIL | Campagnes, SMTP multi, Drag & Drop builder, autoresponder |
| WhatsApp Business | B-WHATSAPP | Bulk WA, chatbot IA, campagnes, CRM intégration |

**Utilisateurs cibles** : Entreprises locales RDC, ONG, banques, gouvernement, institutions publiques, PME, startups, Eglises, hôpitaux, forces de l'ordre, armée.

**Rôles système** : `super_admin` | `admin` | `client` | `agent` | `superviseur`

**Plans SaaS** : `free` | `basic` | `pro` | `enterprise`

**Multi-langue** : Français (défaut), Anglais, Arabe, Espagnol, Portugais, Russe

---

## 2. STACK TECHNIQUE

### Frontend
```
Framework     : React 18 + TypeScript (strict mode)
Build         : Vite
Styling       : TailwindCSS v3 (mobile-first, très responsive)
UI Components : shadcn/ui (base de tous les composants)
Animations    : Framer Motion (motion, AnimatePresence)
State         : Redux Toolkit + RTK Query
Routing       : React Router v6
Forms         : React Hook Form + Zod (validation côté client)
Charts        : Recharts
Tables        : TanStack Table v8
Icons         : Lucide React
i18n          : react-i18next
Date          : date-fns
HTTP          : Axios (instance configurée avec intercepteurs)
WebSocket     : Socket.io-client (temps réel call center)
WebRTC        : simple-peer ou mediasoup-client
Tests         : Jest + React Testing Library + MSW (mock service worker)
Linter        : ESLint + Prettier
```

### Backend
```
Runtime       : Node.js 20 LTS
Framework     : Express.js + TypeScript (strict)
Auth          : JWT (access 15min + refresh 7j) + Zod validation
ORM           : SQL pur (pas d'ORM) — requêtes écrites à la main
Base données  : MySQL 8
Validation    : Zod (tous les inputs)
Hashing       : bcryptjs (saltRounds: 12)
Rate limiting : express-rate-limit
Queue         : Bull (Redis) — pour envois massifs SMS/Email/WA
Temps réel    : Socket.io
VoIP          : Asterisk / FreeSWITCH via AMI/ESL
SMPP          : smpp npm package
Email         : Nodemailer (multi-SMTP)
Tests         : Jest + Supertest
Linter        : ESLint + Prettier
```

### Infrastructure
```
Conteneurs    : Docker + Docker Compose
DB            : MySQL 8 + Redis
Reverse proxy : Nginx
OS            : Ubuntu 24 LTS
Sécurité      : SSL/TLS, Helmet.js, CORS strict, CSP headers
Logs          : Winston + Morgan
```

---

## 3. ARCHITECTURE FRONTEND

```
frontend/
├── public/
├── src/
│   ├── main.tsx                    # Point d'entrée
│   ├── App.tsx                     # Router principal + AnimatePresence
│   ├── assets/                     # Images, fonts, SVG, logos BIAR
│   ├── components/
│   │   ├── ui/                     # Composants shadcn/ui (ne pas modifier)
│   │   ├── common/                 # Composants partagés (Button, Modal, Table...)
│   │   ├── layout/                 # Sidebar, Navbar, PageWrapper
│   │   └── animations/             # Wrappers Framer Motion réutilisables
│   ├── features/                   # 1 dossier par feature métier
│   │   ├── auth/                   # Login, Register, ForgotPassword, OTP
│   │   ├── dashboard/              # Dashboard principal
│   │   ├── call-center/            # B-GOTOCALL — softphone, agents, SVI, ACD
│   │   ├── sms/                    # B-SMSBULK — campagnes, contacts, SMPP
│   │   ├── email/                  # B-EMAIL — campagnes, templates, autoresponder
│   │   ├── whatsapp/               # B-WHATSAPP — bulk, chatbot, templates
│   │   ├── contacts/               # CRM contacts partagé entre modules
│   │   ├── reporting/              # Analytics, rapports, exports
│   │   ├── billing/                # Plans, paiements, factures
│   │   ├── settings/               # Paramètres compte, SMTP, SMPP, API keys
│   │   └── admin/                  # Backoffice super admin
│   ├── hooks/                      # Hooks custom partagés
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── usePermissions.ts
│   │   ├── useDebounce.ts
│   │   ├── usePagination.ts
│   │   └── useLocalStorage.ts
│   ├── services/                   # Appels API (Axios)
│   │   ├── api.ts                  # Instance Axios + intercepteurs
│   │   ├── auth.service.ts
│   │   ├── calls.service.ts
│   │   ├── sms.service.ts
│   │   ├── email.service.ts
│   │   └── whatsapp.service.ts
│   ├── store/                      # Redux Toolkit
│   │   ├── index.ts                # Store configuration
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── callSlice.ts        # État appels en temps réel
│   │   │   ├── notificationSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── api/                    # RTK Query endpoints
│   │       ├── smsApi.ts
│   │       ├── callApi.ts
│   │       └── emailApi.ts
│   ├── types/                      # Types TypeScript globaux
│   │   ├── auth.types.ts
│   │   ├── call.types.ts
│   │   ├── sms.types.ts
│   │   ├── email.types.ts
│   │   ├── whatsapp.types.ts
│   │   ├── contact.types.ts
│   │   └── api.types.ts            # ResponseWrapper<T>, PaginatedResponse<T>
│   ├── helpers/                    # Fonctions utilitaires pures
│   │   ├── format.ts               # formatDate, formatPhone, formatFileSize
│   │   ├── validators.ts           # Fonctions de validation partagées
│   │   ├── sanitize.ts             # !! SÉCURITÉ — DOMPurify wrappers
│   │   ├── encryption.ts           # Chiffrement données sensibles frontend
│   │   └── constants.ts            # Constantes globales
│   ├── datamocks/                  # Données fictives pour dev/tests
│   │   ├── calls.mock.ts
│   │   ├── agents.mock.ts
│   │   ├── campaigns.mock.ts
│   │   └── contacts.mock.ts
│   └── tests/
│       ├── unit/                   # Tests unitaires composants/hooks
│       └── integration/            # Tests intégration flows complets
├── .env.development
├── .env.production
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.ts
└── Dockerfile
```

---

## 4. ARCHITECTURE BACKEND

```
backend/
├── src/
│   ├── app.ts                      # Express app, middlewares globaux
│   ├── server.ts                   # Démarrage serveur, Socket.io, DB connect
│   ├── db/
│   │   ├── config.ts               # Pool MySQL2
│   │   ├── migrations/             # Scripts SQL de migration
│   │   └── seeds/                  # Données de seed
│   ├── controllers/                # Reçoit req/res, délègue au service
│   │   ├── auth.controller.ts
│   │   ├── call.controller.ts
│   │   ├── sms.controller.ts
│   │   ├── email.controller.ts
│   │   ├── whatsapp.controller.ts
│   │   ├── contact.controller.ts
│   │   ├── report.controller.ts
│   │   └── admin.controller.ts
│   ├── services/                   # Logique métier pure
│   │   ├── auth.service.ts
│   │   ├── call.service.ts         # Asterisk AMI, SVI, ACD, routage
│   │   ├── sms.service.ts          # SMPP, queue Bull, délivrabilité
│   │   ├── email.service.ts        # Multi-SMTP, SPF/DKIM, bounce
│   │   ├── whatsapp.service.ts     # WA Business API, templates
│   │   ├── contact.service.ts
│   │   ├── billing.service.ts      # Plans, limites, paiements
│   │   ├── report.service.ts
│   │   └── notification.service.ts
│   ├── routes/                     # Express Router — 1 fichier par domaine
│   │   ├── index.ts                # Agrégateur routes
│   │   ├── auth.routes.ts
│   │   ├── call.routes.ts
│   │   ├── sms.routes.ts
│   │   ├── email.routes.ts
│   │   ├── whatsapp.routes.ts
│   │   ├── contact.routes.ts
│   │   ├── report.routes.ts
│   │   ├── billing.routes.ts
│   │   └── admin.routes.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # Vérification JWT
│   │   ├── rbac.middleware.ts      # Contrôle accès par rôle
│   │   ├── validate.middleware.ts  # Validation Zod centralisée
│   │   ├── rateLimiter.middleware.ts
│   │   ├── security.middleware.ts  # Helmet, CORS, CSP
│   │   ├── sanitize.middleware.ts  # !! Anti-XSS, injection SQL
│   │   ├── tenant.middleware.ts    # Isolation multi-tenant
│   │   └── audit.middleware.ts     # Logs audit gouvernement
│   ├── types/
│   │   ├── express.d.ts            # Augmentation Request (user, tenant)
│   │   ├── auth.types.ts
│   │   ├── call.types.ts
│   │   ├── sms.types.ts
│   │   └── api.types.ts
│   ├── helpers/
│   │   ├── response.helper.ts      # sendSuccess(), sendError()
│   │   ├── jwt.helper.ts
│   │   ├── crypto.helper.ts
│   │   ├── phone.helper.ts         # Format numéros RDC (+243)
│   │   └── pagination.helper.ts
│   ├── assets/                     # Templates email HTML, fichiers statiques
│   ├── queue/                      # Workers Bull
│   │   ├── sms.worker.ts
│   │   ├── email.worker.ts
│   │   └── whatsapp.worker.ts
│   └── tests/
│       ├── unit/
│       └── integration/
├── .env
├── .env.example
├── tsconfig.json
├── jest.config.ts
├── Dockerfile
└── docker-compose.yml
```

---

## 5. CONVENTIONS DE CODE

### Nommage
```typescript
// Composants React : PascalCase
const AgentDashboard: React.FC = () => {}

// Hooks custom : camelCase avec préfixe "use"
const useCallStatus = () => {}

// Services : camelCase
const smsService = { sendBulk, getStatus }

// Types/Interfaces : PascalCase avec suffixe explicite
interface CallSession {}
type ApiResponse<T> = {}

// Constantes : SCREAMING_SNAKE_CASE
const MAX_SMS_PER_BATCH = 10000

// Fichiers : kebab-case
// agent-dashboard.tsx, sms.service.ts, call.types.ts
```

### TypeScript
```typescript
// INTERDIT : any implicite ou explicite
const data: any = {} // ❌ JAMAIS

// OBLIGATOIRE : types explicites partout
const data: CallSession = {} // ✅

// OBLIGATOIRE : interface pour les props React
interface AgentCardProps {
  agent: Agent
  onStatusChange: (status: AgentStatus) => void
}

// OBLIGATOIRE : Zod pour validation à la frontière (API, forms)
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
```

### Structure d'une feature
```
features/call-center/
├── components/           # Composants UI spécifiques à la feature
├── hooks/                # Hooks spécifiques à la feature
├── pages/                # Pages/vues de la feature
├── store/                # Slice Redux de la feature (si nécessaire)
├── types/                # Types locaux de la feature
└── index.ts              # Exports publics de la feature
```

### Animations Framer Motion
```typescript
// Toujours utiliser AnimatePresence pour les transitions de page
// Pattern standard pour les entrées de composants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

// Stagger pour les listes
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
}
```

---

## 6. SÉCURITÉ — RÈGLES ABSOLUES

> ⚠️ CONTEXTE GOUVERNEMENTAL RDC — TOLÉRANCE ZÉRO AUX FAILLES

### Anti-XSS
```typescript
// FRONTEND : Toujours utiliser DOMPurify avant d'injecter du HTML
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)

// Ne JAMAIS utiliser dangerouslySetInnerHTML sans DOMPurify
// Ne JAMAIS interpoler de données utilisateur dans des templates string HTML

// BACKEND : Middleware sanitize sur TOUS les inputs
import xss from 'xss'
const sanitized = xss(req.body.message)
```

### Anti-SQL Injection
```typescript
// TOUJOURS utiliser des requêtes paramétrées — JAMAIS de concaténation
// ✅ CORRECT
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE email = ? AND tenant_id = ?',
  [email, tenantId]
)

// ❌ INTERDIT — injection SQL possible
const query = `SELECT * FROM users WHERE email = '${email}'`
```

### Authentification
```typescript
// JWT : access token 15min, refresh token 7 jours
// Refresh token stocké en httpOnly cookie UNIQUEMENT
// Access token en mémoire (pas localStorage, pas sessionStorage)
// TOUJOURS vérifier le tenant_id dans chaque requête
// TOUJOURS vérifier le rôle avant toute action sensible
```

### Headers de sécurité obligatoires (backend)
```typescript
// Helmet.js configuré avec :
// - Content-Security-Policy strict
// - X-XSS-Protection
// - X-Frame-Options: DENY
// - X-Content-Type-Options: nosniff
// - Strict-Transport-Security
// - Referrer-Policy: no-referrer
```

### Rate Limiting
```typescript
// Auth routes : 5 tentatives / 15 minutes par IP
// API publique : 100 req / minute par IP
// SMS/Email envoi : selon quota du plan SaaS
// Endpoints sensibles (mot de passe, OTP) : rate limit strict
```

### Multi-tenant isolation
```typescript
// CHAQUE requête SQL doit filtrer par tenant_id
// Middleware tenant.middleware.ts extrait et vérifie le tenant
// Ne jamais exposer les données d'un tenant à un autre
// Vérifier la propriété des ressources avant modification
```

### Données sensibles
```typescript
// Mots de passe : bcryptjs saltRounds 12 minimum
// Clés API : stockées chiffrées en base (AES-256)
// Numéros de téléphone : masked dans les logs
// Tokens JWT : signés avec secret fort (256 bits minimum)
// Variables d'env : JAMAIS de secrets hardcodés dans le code
```

---

## 7. VARIABLES D'ENVIRONNEMENT

### Frontend (.env.example)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=BIAR Actor Hub
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=
```

### Backend (.env.example)
```env
# Serveur
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=biar_cpaas
DB_USER=
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=                     # 256 bits minimum
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
JWT_REFRESH_SECRET=             # Différent du JWT_SECRET

# Sécurité
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
ENCRYPTION_KEY=                 # AES-256

# SMTP (multi)
SMTP_DEFAULT_HOST=
SMTP_DEFAULT_PORT=587
SMTP_DEFAULT_USER=
SMTP_DEFAULT_PASS=

# SMPP (SMS)
SMPP_HOST=
SMPP_PORT=2775
SMPP_SYSTEM_ID=
SMPP_PASSWORD=

# WhatsApp Business API
WA_API_URL=
WA_API_TOKEN=
WA_PHONE_NUMBER_ID=

# Asterisk (Call Center)
AMI_HOST=localhost
AMI_PORT=5038
AMI_USER=
AMI_SECRET=

# Paiements
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Logs
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

---

## 8. PATTERNS API

### Response standard
```typescript
// Succès
{
  "success": true,
  "data": {},
  "message": "Opération réussie",
  "meta": { "page": 1, "total": 100, "perPage": 20 }
}

// Erreur
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email invalide",
    "details": []
  }
}
```

### Pagination
```typescript
// Toutes les listes paginées : ?page=1&limit=20&search=&sortBy=createdAt&order=desc
// Response inclut toujours meta.total, meta.page, meta.lastPage
```

### Versioning
```
/api/v1/auth/login
/api/v1/sms/campaigns
/api/v1/calls/sessions
/api/v1/email/campaigns
/api/v1/whatsapp/campaigns
```

---

## 9. BASE DE DONNÉES — RÈGLES SQL

```sql
-- Toujours utiliser des requêtes paramétrées avec mysql2
-- Toujours inclure tenant_id dans les WHERE des tables multi-tenant
-- Toujours utiliser des transactions pour les opérations multi-tables
-- Indexes obligatoires sur : tenant_id, created_at, status, foreign keys
-- Soft delete : deleted_at TIMESTAMP NULL (jamais DELETE physique sur données métier)
-- Timestamps : created_at, updated_at sur toutes les tables

-- Tables principales :
-- tenants, users, roles, permissions, user_roles
-- call_sessions, call_queues, agents, svi_configs
-- sms_campaigns, sms_messages, sms_contacts, sms_templates
-- email_campaigns, email_messages, email_lists, email_templates
-- wa_campaigns, wa_messages, wa_contacts, wa_templates
-- contacts (partagé entre modules), contact_lists
-- billing_plans, subscriptions, invoices, transactions
-- api_keys, audit_logs, notifications
```

---

## 10. TESTS

### Frontend
```typescript
// Unit : tester chaque composant, hook, helper de façon isolée
// Integration : tester les flows complets (login → dashboard, créer campagne → envoi)
// Mocking : utiliser MSW pour intercepter les appels API dans les tests
// Coverage minimum : 70%

// Exemple de test composant
describe('AgentCard', () => {
  it('affiche le statut de l agent correctement', () => {
    render(<AgentCard agent={mockAgent} />)
    expect(screen.getByText('Disponible')).toBeInTheDocument()
  })
})
```

### Backend
```typescript
// Unit : tester chaque service isolément (mocker le pool DB)
// Integration : tester chaque endpoint avec supertest
// Toujours tester les cas d'erreur et edge cases
// Tester les validations Zod
// Coverage minimum : 75%

// Exemple test endpoint
describe('POST /api/v1/auth/login', () => {
  it('retourne 401 si mot de passe incorrect', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'mauvais' })
    expect(res.status).toBe(401)
  })
})
```

---
## 11. DESIGN & UI

Charte graphique BIAR GROUP :
- Couleur primaire : #E91E8C (rose/magenta BIAR)
- Couleur secondaire : #3B2F8F (violet BIAR)
- Fond clair : #FFFFFF
- Fond sombre : #0F0F1A
- Texte : #1A1A2E
- Accent : gradient rose → violet

Polices : à définir selon Figma (consulter le lien Figma en priorité)

Responsive : Mobile-first OBLIGATOIRE
- xs: 320px (téléphones bas de gamme Congo)
- sm: 375px
- md: 768px
- lg: 1024px
- xl: 1280px

Animations Framer Motion :
- Page transitions : fade + slide (0.3s)
- Listes : stagger 0.05s entre items
- Modals : scale + fade
- Boutons : tap scale 0.95
- Loading states : skeleton avec shimmer

Accessibilité :
- Contraste WCAG AA minimum
- aria-label sur tous les boutons icon-only
- Focus visible sur tous les éléments interactifs
- Support clavier complet
```

---

## 12. REPOS GITHUB DE RÉFÉRENCE

> Utiliser ces repos comme inspiration de style de code pour paraître 100% humain

```
Architecture React  : github.com/alan2207/bulletproof-react
UI Components       : github.com/shadcn-ui/ui
App complète        : github.com/shadcn-ui/taxonomy
Real-time dashboard : github.com/calcom/cal.com (structure features)
SaaS boilerplate    : github.com/ixartz/SaaS-Boilerplate
Redux patterns      : github.com/reduxjs/redux-toolkit (exemples officiels)
Express TypeScript  : github.com/microsoft/TypeScript-Node-Starter
Testing patterns    : github.com/testing-library/react-testing-library
```

---

## 13. COMMANDES UTILES

```bash
# FRONTEND
cd frontend
npm run dev           # Démarrage dev (port 5173)
npm run build         # Build production
npm run test          # Tests Jest
npm run test:watch    # Tests en watch mode
npm run test:coverage # Rapport de couverture
npm run lint          # ESLint
npm run type-check    # Vérification TypeScript

# BACKEND
cd backend
npm run dev           # Démarrage dev avec ts-node-dev (port 5000)
npm run build         # Compile TypeScript
npm run start         # Démarrage production
npm run test          # Tests Jest + Supertest
npm run test:coverage # Rapport de couverture
npm run migrate       # Exécute les migrations SQL
npm run seed          # Insère les données de seed
npm run lint          # ESLint

# DOCKER
docker-compose up -d          # Démarrage complet
docker-compose logs -f app    # Logs en direct
docker-compose down           # Arrêt
```

---

## 14. RÈGLES DE TRAVAIL AVEC CLAUDE

### Économiser les tokens
- Toujours pointer le fichier EXACT à modifier, jamais "modifier le projet"
- Utiliser `/compact` quand la conversation devient longue
- Utiliser `/clear` entre des tâches sans rapport
- Demander un fichier à la fois pour les nouvelles features

### Qualité du code
- Écrire des commentaires courts et naturels, style dev pressé
- Varier les styles (arrow functions vs function déclarée selon le fichier)
- Quelques noms courts (tmp, idx, res) dans les fonctions internes
- NE PAS sur-documenter — le code doit se lire seul

### Sécurité — checklist avant chaque PR
- [ ] Tous les inputs validés avec Zod
- [ ] Pas de `any` TypeScript
- [ ] Requêtes SQL paramétrées
- [ ] Inputs sanitizés (XSS)
- [ ] tenant_id vérifié dans chaque requête
- [ ] Pas de secrets dans le code
- [ ] Tests écrits pour le nouveau code
- [ ] Headers sécurité présents

### Format des commits
```
feat: add agent status management
fix: call queue not updating in real time
wip: sms campaign builder
refactor: split auth service
test: add login endpoint tests
```

---

## 15. CONTEXTE SPÉCIAL — RDC CONGO

```
- Connexions internet parfois lentes → optimiser les bundles (lazy loading obligatoire)
- Utiliser des téléphones entry-level → tester sur 320px minimum
- Mobile Money local (M-Pesa, Airtel Money, Orange Money) → prévoir dans billing
- Opérateurs locaux RDC : Vodacom, Airtel, Orange, Africell → SMPP avec eux
- Préfixe téléphonique : +243 → validation helper dédié
- Langue principale : Français → défaut de l'app
- Contexte gouvernemental → audit logs obligatoires sur toutes les actions sensibles
- Données sensibles institutions (police, armée, ministères) → chiffrement renforcé
```

---

---

## 16. ÉTAT D'IMPLÉMENTATION

> Mis à jour à chaque session. Relis avant de demander quoi que ce soit pour éviter de refaire ce qui est fait.

### ✅ Frontend — Complété

| Fichier | Description |
|---|---|
| `features/auth/pages/LoginPage.tsx` | Page login complète |
| `features/auth/pages/RegisterPage.tsx` | Inscription 3 étapes — navigue vers `/verify-email` après submit |
| `features/auth/pages/ForgotPasswordPage.tsx` | Page mot de passe oublié |
| `features/auth/pages/VerifyEmailPage.tsx` | OTP 6 chiffres + email readonly + countdown 60s |
| `features/auth/schemas/auth.schemas.ts` | Zod schemas : login, register (steps + full), forgotPassword, resetPassword |
| `components/common/Toast.tsx` | Wrapper react-hot-toast — success/error/warning/info |
| `components/common/ToastContainer.tsx` | Toast Redux + Framer Motion (coexiste avec react-hot-toast) |
| `hooks/useToast.ts` | `useToast()` → success / error / warning / info |
| `App.tsx` | Routes configurées + `BiarToaster` monté |

### ✅ Backend — Complété

| Fichier | Description |
|---|---|
| `helpers/response.helper.ts` | `sendSuccess` / `sendError` |
| `helpers/jwt.helper.ts` | `generateAccessToken` / `generateRefreshToken` / `verify*` |
| `helpers/crypto.helper.ts` | `encrypt` / `decrypt` / `generateOtp` / `hashData` / `generateApiKey` |
| `helpers/phone.helper.ts` | Validation numéros +243 RDC |
| `helpers/pagination.helper.ts` | Pagination SQL |
| `middlewares/auth.middleware.ts` | `authMiddleware` + `verifyRole(...roles)` |
| `middlewares/validate.middleware.ts` | `validateMiddleware(schema)` + `validateQuery(schema)` |
| `middlewares/rateLimiter.middleware.ts` | `rateLimiterMiddleware` / `authRateLimiter` / `sensitiveRateLimiter` |
| `middlewares/security.middleware.ts` | Helmet, CSP, headers sécurité |
| `middlewares/sanitize.middleware.ts` | Anti-XSS sur tous les inputs |
| `middlewares/tenant.middleware.ts` | Isolation multi-tenant |
| `middlewares/audit.middleware.ts` | Audit logs gouvernement |
| `middlewares/rbac.middleware.ts` | Contrôle accès par rôle |
| `services/auth.service.ts` | **IMPLÉMENTÉ** : register, login, logout, refreshToken, forgotPassword, resetPassword, verifyEmail, verifyOtp, getMe |
| `controllers/auth.controller.ts` | **IMPLÉMENTÉ** : tous les handlers, cookie httpOnly refresh token |
| `routes/auth.routes.ts` | **IMPLÉMENTÉ** : 9 routes avec validation Zod |
| `db/migrations/001_create_auth_tables.sql` | Tables : tenants, users, refresh_tokens, audit_logs |
| `db/migrations/run-migrations.ts` | Runner avec table `schema_migrations` (idempotent) |

### 🔴 TODO — Pas encore implémenté

| Priorité | Item |
|---|---|
| HAUTE | Envoi email Nodemailer (OTP vérification + reset password) — marqué TODO dans `auth.service.ts` |
| HAUTE | Tous les autres modules : SMS, Email, WhatsApp, Call Center, Contacts, Billing, Reporting, Admin |
| MOYENNE | Tests Jest : `auth.service.test.ts`, `auth.test.ts` |
| BASSE | SMS OTP via SMPP (B-SMSBULK) |

### Notes techniques importantes
- Refresh token : httpOnly cookie (`/api/v1/auth`) + fallback body pour clients mobiles
- OTP email : stocké dans `users.email_verification_token` (6 chiffres)
- Reset password : token 32 bytes hex dans `users.password_reset_token`, expire 1h
- Soft delete partout : `deleted_at IS NULL` dans toutes les requêtes
- Audit log : toutes les actions sensibles enregistrées dans `audit_logs`

---

*Dernière mise à jour : Avril 2026 — BIAR GROUP AFRICA SARLU*
*Ce fichier fait autorité sur toute autre instruction dans la session*