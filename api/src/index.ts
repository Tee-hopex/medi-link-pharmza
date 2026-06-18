import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { env } from './config/env'
import { errorHandler, notFound } from './middleware/error.middleware'
import { initSockets } from './sockets'
import { startExpiryAlertsJob } from './jobs/expiry-alerts.job'

import authRouter from './modules/auth/auth.router'
import usersRouter from './modules/users/users.router'
import inventoryRouter from './modules/inventory/inventory.router'
import marketplaceRouter from './modules/marketplace/marketplace.router'
import ordersRouter from './modules/orders/orders.router'
import pharmaciesRouter from './modules/pharmacies/pharmacies.router'
import emergencyRxRouter from './modules/emergency-rx/emergency-rx.router'
import analyticsRouter from './modules/analytics/analytics.router'
import networkRouter from './modules/network/network.router'
import patientsRouter from './modules/patients/patients.router'
import walletRouter from './modules/wallet/wallet.router'
import jobsRouter from './modules/jobs/jobs.router'
import notificationsRouter from './modules/notifications/notifications.router'

const app = express()
const httpServer = http.createServer(app)

// Socket.io
const io = initSockets(httpServer)
app.set('io', io)

// Middleware
app.use(helmet())
app.use(cors({
  origin: env.NODE_ENV === 'production' ? env.CLIENT_URL : true,
  credentials: true,
}))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }))

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API routes
const v1 = '/api/v1'
app.use(`${v1}/auth`, authRouter)
app.use(`${v1}/users`, usersRouter)
app.use(`${v1}/inventory`, inventoryRouter)
app.use(`${v1}/marketplace`, marketplaceRouter)
app.use(`${v1}/orders`, ordersRouter)
app.use(`${v1}/pharmacies`, pharmaciesRouter)
app.use(`${v1}/emergency-rx`, emergencyRxRouter)
app.use(`${v1}/analytics`, analyticsRouter)
app.use(`${v1}/network`, networkRouter)
app.use(`${v1}/patients`, patientsRouter)
app.use(`${v1}/wallet`, walletRouter)
app.use(`${v1}/jobs`, jobsRouter)
app.use(`${v1}/notifications`, notificationsRouter)

// Error handling
app.use(notFound)
app.use(errorHandler)

// Start
httpServer.listen(env.PORT, () => {
  console.log(`\n🚀 Medi-Link API running on http://localhost:${env.PORT}`)
  console.log(`   Environment: ${env.NODE_ENV}`)
  startExpiryAlertsJob()
})

export default app
