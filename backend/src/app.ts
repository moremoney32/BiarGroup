import express, { Application } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
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

// CORS
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))

// Routes
app.use('/api/v1', router)

export default app
