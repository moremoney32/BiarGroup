import express, { Application } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import { securityMiddleware } from './middlewares/security.middleware'
import { sanitizeMiddleware } from './middlewares/sanitize.middleware'
import { rateLimiterMiddleware } from './middlewares/rateLimiter.middleware'
import router from './routes/index'

const app: Application = express()

// Nginx proxy — trust first hop
app.set('trust proxy', 1)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Security
app.use(helmet())
app.use(securityMiddleware)
app.use(sanitizeMiddleware)
app.use(rateLimiterMiddleware)

// Logging
app.use(morgan('combined'))

// CORS — accepte plusieurs origines séparées par virgule dans CORS_ORIGIN
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Requêtes sans origin (curl, apps mobiles, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin non autorisée — ${origin}`))
  },
  credentials: true,
}))

// Fichiers statiques — images uploadées
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// Routes
app.use('/api/v1', router)

export default app
