# Guide complet — Dockeriser une app React + Node.js + MySQL + Redis
> Basé sur le projet BIAR GROUP AFRICA — Actor Hub CPaaS
> Rédigé après expérience réelle de déploiement. Tout ce qui est écrit ici a été testé et validé.

---

## PARTIE 1 — LES ÉTAPES QUI MARCHENT

### Structure du projet
```
BiarGroup/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express + TypeScript
├── docker-compose.yml # Orchestrateur de tous les services
└── .env               # Variables partagées pour docker-compose
```

---

### Étape 1 — Le fichier `.env` à la racine (pour docker-compose)

Ce fichier contient les **secrets partagés** entre les services. Il est lu automatiquement par `docker compose`.

```env
# BiarGroup/.env
DB_ROOT_PASSWORD=tonMotDePasseRoot
DB_NAME=biar_cpaas
DB_USER=biar_user
DB_PASSWORD=tonMotDePasseDB
REDIS_PASSWORD=tonMotDePasseRedis
```

> **Règle** : ce fichier ne va **jamais** sur GitHub. Ajoute-le dans `.gitignore`.

---

### Étape 2 — Le `docker-compose.yml`

```yaml
services:
  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: /api/v1       # URL relative — nginx proxie vers backend
        VITE_SOCKET_URL: ""
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro   # SSL (prod seulement)
    depends_on:
      - backend
    networks:
      - biar_net

  backend:
    build: ./backend
    env_file: ./backend/.env         # Secrets du backend
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - biar_net

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3307:3306"    # 3307 à l'extérieur pour éviter conflit avec MySQL local
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5
    networks:
      - biar_net

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5
    networks:
      - biar_net

volumes:
  mysql_data:
  redis_data:

networks:
  biar_net:
    driver: bridge
```

---

### Étape 3 — Le `Dockerfile` frontend (React + Vite)

```dockerfile
# frontend/Dockerfile

# ── Étape 1 : build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps    # pas npm ci — évite l'erreur lock file

COPY . .

# Injecter les variables Vite au moment du build (pas au runtime)
ARG VITE_API_URL=/api/v1
ARG VITE_SOCKET_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build                     # génère dist/

# ── Étape 2 : serveur nginx ───────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
```

**Pourquoi `ARG/ENV` et pas le fichier `.env` ?**

Vite compile les variables `VITE_*` dans le bundle JavaScript au moment du `npm run build`.
Si tu passes les variables via `.env.production`, Docker doit avoir accès au fichier au moment du build.
C'est plus fiable et garanti de les passer directement comme `ARG` dans le Dockerfile.

---

### Étape 4 — Le `nginx.conf` frontend

**En local (HTTP seulement) :**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Proxy API vers le backend interne Docker
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # SPA — toujours renvoyer index.html pour que React Router fonctionne
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**En production (HTTPS avec Let's Encrypt) :**
```nginx
server {
    listen 80;
    server_name biargroup.sbs www.biargroup.sbs;
    return 301 https://$host$request_uri;   # force HTTPS
}

server {
    listen 443 ssl;
    server_name biargroup.sbs www.biargroup.sbs;

    ssl_certificate /etc/letsencrypt/live/biargroup.sbs/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/biargroup.sbs/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### Étape 5 — Le `Dockerfile` backend (Node.js + TypeScript)

```dockerfile
# backend/Dockerfile

# ── Étape 1 : build TypeScript ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Compiler TS vers JS ET copier les fichiers SQL
# IMPORTANT : tsc ne copie pas les fichiers .sql, il faut le faire manuellement
RUN npm run build && cp src/db/migrations/*.sql dist/db/migrations/

# ── Étape 2 : image de production légère ──────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev              # seulement les dépendances de prod

COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["node", "dist/server.js"]
```

---

### Étape 6 — Le `.env` du backend

```env
# backend/.env

NODE_ENV=production
PORT=5000

# Base de données
# IMPORTANT : en Docker, les services se parlent par nom de service, pas localhost
DB_HOST=mysql        # <- nom du service dans docker-compose, pas "localhost"
DB_PORT=3306
DB_NAME=biar_cpaas
DB_USER=biar_user
DB_PASSWORD=tonMotDePasseDB

# Redis
REDIS_HOST=redis     # <- nom du service dans docker-compose
REDIS_PORT=6379
REDIS_PASSWORD=tonMotDePasseRedis

# JWT
JWT_SECRET=unSecretDe256BitsMinimum
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=unAutreSecretDifferent
JWT_REFRESH_EXPIRES=7d

# CORS — URL du frontend en production
# IMPORTANT : cette variable sert aussi à construire les liens dans les emails
# En local  : CORS_ORIGIN=http://localhost:5173
# En prod   : CORS_ORIGIN=https://tondomaine.com
CORS_ORIGIN=https://biargroup.sbs

# Email API
EMAIL_API_URL=https://ton-api-mail.com/send

# Bcrypt
BCRYPT_SALT_ROUNDS=12
```

---

### Étape 7 — Les `.dockerignore`

**frontend/.dockerignore :**
```
node_modules
.env.local
.env.development
.env.*.local
dist
```

> Ne pas exclure `.env.production` si tu t'en sers dans le build.

**backend/.dockerignore :**
```
node_modules
dist
.env
*.log
```

---

### Étape 8 — Commandes essentielles

```bash
# Premier démarrage complet (build + démarrage)
docker compose up -d --build

# Rebuild un seul service puis le redémarrer
docker compose build backend
docker compose up -d backend

# Rebuild frontend et backend en même temps
docker compose build backend frontend && docker compose up -d backend frontend

# Voir les logs en direct
docker compose logs -f backend
docker compose logs -f frontend

# Lancer les migrations SQL
docker compose exec backend node dist/db/migrations/run-migrations.js

# Vérifier l'état de tous les containers
docker compose ps

# Redémarrer un service sans rebuild (si tu changes juste un .env)
docker compose restart backend

# Arrêter tout sans supprimer les données
docker compose down

# Arrêter tout ET supprimer les volumes (DANGER — efface la base de données)
docker compose down -v

# Forcer un rebuild sans cache (si le cache pose problème)
docker compose build --no-cache backend
```

---

### Étape 9 — Déploiement sur VPS Ubuntu (Hostinger, DigitalOcean, etc.)

```bash
# 1. Se connecter au VPS
ssh root@IP_DU_VPS

# 2. Installer Docker
curl -fsSL https://get.docker.com | sh

# 3. Cloner le projet
git clone https://github.com/ton-user/ton-repo.git /opt/monapp
cd /opt/monapp

# 4. Créer les fichiers .env (jamais sur git, les créer à la main sur le VPS)
nano .env               # variables pour docker-compose (DB_ROOT_PASSWORD, etc.)
nano backend/.env       # variables backend (DB_HOST=mysql, CORS_ORIGIN=https://..., etc.)

# 5. Démarrer tous les services
docker compose up -d --build

# 6. Lancer les migrations
docker compose exec backend node dist/db/migrations/run-migrations.js

# 7. Installer Certbot pour le SSL (Let's Encrypt)
apt install certbot -y

# Arrêter le frontend pour libérer le port 80
docker compose stop frontend

# Générer le certificat SSL
certbot certonly --standalone -d tondomaine.com -d www.tondomaine.com

# Redémarrer le frontend (nginx.conf doit déjà avoir la config HTTPS)
docker compose start frontend

# 8. Mettre à jour depuis GitHub (après un git push depuis ton PC)
git pull
docker compose build backend frontend
docker compose up -d backend frontend
```

---

## PARTIE 2 — ERREURS RENCONTRÉES ET SOLUTIONS

### Erreur 1 — `npm ci` échoue : lock file out of sync
```
npm error `npm ci` can only install packages when your package.json
and package-lock.json are in sync
```
**Cause** : tu as ajouté des packages (`npm install xxx`) après avoir généré le lock file, et le Dockerfile utilise encore `npm ci`.

**Solution** : dans le Dockerfile frontend, remplacer `npm ci` par :
```dockerfile
RUN npm install --legacy-peer-deps
```

---

### Erreur 2 — Module introuvable au build
```
Module not found: Can't resolve '@tanstack/react-table'
Module not found: Can't resolve 'i18next'
```
**Cause** : le package est utilisé dans le code mais absent du `package.json`.

**Solution** :
```bash
npm install @tanstack/react-table i18next react-i18next
# puis committer le package.json et package-lock.json mis à jour
git add package.json package-lock.json
git commit -m "fix: add missing dependencies"
```

---

### Erreur 3 — `VITE_API_URL` vide dans Docker (requêtes vers le mauvais URL)
**Cause** : Vite compile les variables `VITE_*` dans le JS au moment du build. Si elles ne sont pas disponibles pendant le build Docker, elles sont vides.

**Solution** : passer les variables comme `ARG` dans le Dockerfile :
```dockerfile
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```
Et dans `docker-compose.yml` :
```yaml
build:
  context: ./frontend
  args:
    VITE_API_URL: /api/v1
```

---

### Erreur 4 — DNS Docker : `auth.docker.io: no such host`
**Cause** : Docker Desktop n'a pas de serveur DNS configuré pour résoudre les noms externes.

**Solution** : dans Docker Desktop → Settings → Docker Engine, ajouter :
```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```
Puis cliquer "Apply & Restart".

---

### Erreur 5 — Migration SQL : colonne déjà existante
```
Error: Duplicate column name 'email_verification_expires'
```
**Cause** : une migration 002 essayait d'ajouter une colonne déjà créée dans la migration 001.

**Solution** : supprimer la migration redondante. Toujours vérifier que les migrations sont idempotentes (ne pas recréer ce qui existe déjà). Utiliser `ADD COLUMN IF NOT EXISTS` en MySQL 8.

---

### Erreur 6 — Fichiers `.sql` absents dans `dist/`
```
Error: ENOENT: no such file or directory, open 'dist/db/migrations/001_create_auth_tables.sql'
```
**Cause** : `tsc` (compilateur TypeScript) ne copie que les fichiers `.ts`. Les fichiers `.sql` sont ignorés.

**Solution** : ajouter une commande `cp` dans le Dockerfile après le build :
```dockerfile
RUN npm run build && cp src/db/migrations/*.sql dist/db/migrations/
```

---

### Erreur 7 — `ts-node: not found` en production
**Cause** : `ts-node` est une devDependency. En production avec `npm ci --omit=dev`, il n'est pas installé.

**Solution** : modifier le script de migration dans `package.json` pour utiliser le JS compilé :
```json
"migrate": "node dist/db/migrations/run-migrations.js"
```
(Au lieu de `ts-node src/db/migrations/run-migrations.ts`)

---

### Erreur 8 — `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
```
Error: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
```
**Cause** : `express-rate-limit` reçoit un header `X-Forwarded-For` de nginx mais Express ne fait pas confiance au proxy.

**Solution** : ajouter dans `app.ts` **avant** le middleware rate-limit :
```typescript
app.set('trust proxy', 1)
```

---

### Erreur 9 — Emails non reçus : `ETIMEDOUT` / `ENETUNREACH`
```
Error: connect ETIMEDOUT
Error: connect ENETUNREACH (IPv6)
```
**Cause** : Docker utilise parfois IPv6 pour les connexions sortantes, mais le réseau Docker ne le supporte pas toujours.

**Solution** : forcer IPv4 dans les appels HTTP Node.js :
```typescript
const req = lib.request({
  hostname: parsed.hostname,
  path: parsed.pathname,
  method: 'POST',
  family: 4,   // <- force IPv4
  ...
})
```

---

### Erreur 10 — Reset password → redirige vers la page d'accueil
**Cause** : la route `/reset-password` n'existait pas dans `App.tsx`. React Router tombait sur le catch-all `*` et redirigeait vers `/`.

**Solution** : ajouter la route dans `App.tsx` :
```tsx
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage'))
// ...
<Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
```

---

### Erreur 11 — Après reset password → renvoyé vers la page OTP au lieu du dashboard
**Cause double** :
1. `resetPassword` ne marquait pas l'email comme vérifié, donc un user non vérifié restait bloqué après reset
2. `ProtectedRoute` utilisait `emailVerifiedAt` (nullable) au lieu du boolean `isEmailVerified`

**Solution** :
```typescript
// backend/auth.service.ts — resetPassword
await pool.execute(
  `UPDATE users
   SET password_hash = ?,
       password_reset_token = NULL,
       password_reset_expires = NULL,
       is_email_verified = 1,
       email_verified_at = COALESCE(email_verified_at, NOW())
   WHERE id = ?`,
  [passwordHash, user.id]
)
```
```typescript
// Ajouter isEmailVerified au type User et à mapRowToUser
isEmailVerified: Boolean(row.is_email_verified),
```
```tsx
// App.tsx — ProtectedRoute
if (user && !user.isEmailVerified) return <Navigate to="/verify-email" replace />
```

---

### Erreur 12 — Lien de reset password avec `localhost` dans l'email en production
**Cause** : la variable `CORS_ORIGIN` sur le VPS pointait encore vers `localhost`.

**Solution** :
```bash
# Sur le VPS
sed -i 's|CORS_ORIGIN=.*|CORS_ORIGIN=https://tondomaine.com|' /opt/monapp/backend/.env
docker compose restart backend
```

---

## PARTIE 3 — RÉCAPITULATIF DES FICHIERS `.env`

```
MonProjet/
├── .env                   ← Pour docker-compose uniquement (variables $VAR dans compose)
├── backend/
│   └── .env               ← Variables runtime du backend (lues par Node.js au démarrage)
└── frontend/
    ├── .env.development    ← Variables dev local (VITE_API_URL=http://localhost:5000/api/v1)
    └── .env.production     ← Variables prod (VITE_API_URL=/api/v1) — peu utile en Docker
```

### Règles à retenir

| Règle | Explication |
|-------|-------------|
| Variables `VITE_*` = compile-time | Elles sont intégrées dans le JS au build. Passe-les avec `ARG` dans le Dockerfile. |
| Variables backend = runtime | Lues au démarrage de Node.js. Passe-les avec `env_file` dans docker-compose. |
| `DB_HOST=mysql` en Docker | Les services se parlent par nom de service, jamais par `localhost`. |
| `CORS_ORIGIN` = base des liens email | Toujours mettre l'URL de prod en production, sinon les emails contiennent `localhost`. |
| `.env` jamais sur GitHub | Crée les `.env` manuellement sur chaque machine (local + VPS). |
| `docker compose restart` vs `build` | `restart` = redémarre sans rebuild (utile si tu changes juste un `.env`). `build` = recompile l'image. |

---

## PARTIE 4 — CHECKLIST AVANT CHAQUE DÉPLOIEMENT

```
[ ] package.json contient TOUS les packages utilisés dans le code
[ ] .dockerignore ne bloque pas les fichiers nécessaires au build
[ ] Variables VITE_* passées en ARG dans le Dockerfile frontend
[ ] backend/.env sur le VPS contient CORS_ORIGIN=https://tondomaine.com
[ ] backend/.env sur le VPS contient DB_HOST=mysql (pas localhost)
[ ] nginx.conf a la config HTTPS si certificat SSL généré
[ ] Certificat SSL monté dans docker-compose.yml via volumes
[ ] app.set('trust proxy', 1) présent dans app.ts (si derrière nginx)
[ ] Migrations lancées après le premier démarrage
[ ] Tous les containers sont "healthy" avec docker compose ps
```

---

*Rédigé après déploiement réel du projet BIAR GROUP AFRICA Actor Hub — Avril 2026*
*Hostinger KVM1 — Ubuntu 24.04 LTS — Docker 26 — domaine : biargroup.sbs*
