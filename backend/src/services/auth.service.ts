import crypto from 'crypto'
import { RowDataPacket, OkPacket } from 'mysql2'
import bcrypt from 'bcryptjs'
import { pool } from '../db/config'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../helpers/jwt.helper'
import { generateOtp, hashData } from '../helpers/crypto.helper'
import type { RegisterInput, AuthTokens, User, UserRole } from '../types/auth.types'
import { sendOtpEmail, sendResetPasswordEmail } from '../helpers/mailer.helper'

const SALT_ROUNDS = 12

// ─── Helpers internes ────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function mapRowToUser(row: RowDataPacket): User {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone ?? null,
    role: row.role as UserRole,
    isActive: Boolean(row.is_active),
    isEmailVerified: Boolean(row.is_email_verified),
    emailVerifiedAt: row.email_verified_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  }
}

function makeTokens(userId: number, tenantId: number, email: string, role: UserRole): AuthTokens {
  return {
    accessToken: generateAccessToken({ id: userId, tenantId, email, role }),
    refreshToken: generateRefreshToken({ id: userId, tenantId, email, role }),
  }
}

async function storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
  const tokenHash = hashData(refreshToken)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  )
}

async function logAudit(
  userId: number | null,
  tenantId: number | null,
  action: string,
  ip?: string,
  details?: object
): Promise<void> {
  await pool.execute(
    'INSERT INTO audit_logs (user_id, tenant_id, action, ip_address, details) VALUES (?, ?, ?, ?, ?)',
    [userId, tenantId, action, ip ?? null, details ? JSON.stringify(details) : null]
  )
}

function fail(message: string, statusCode: number, code: string): never {
  throw Object.assign(new Error(message), { statusCode, code })
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  async register(
    input: RegisterInput,
    ip?: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password, firstName, lastName, phone, tenantName, plan = 'free' } = input

    // Email déjà pris ?
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      [email]
    )
    if (existing.length > 0) {
      fail('Email déjà utilisé', 409, 'EMAIL_TAKEN')
    }

    // Créer le tenant
    const name = tenantName ?? `${firstName} ${lastName}`
    let slug = toSlug(name)
    const [slugRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM tenants WHERE slug LIKE ? LIMIT 1',
      [`${slug}%`]
    )
    if (slugRows.length > 0) slug = `${slug}-${Date.now()}`

    const [tenantRes] = await pool.execute<OkPacket>(
      'INSERT INTO tenants (name, slug, plan) VALUES (?, ?, ?)',
      [name, slug, plan]
    )
    const tenantId = tenantRes.insertId

    // Hash mot de passe + OTP de vérification email (valable 2 minutes)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const verificationOtp = generateOtp(6)
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000)

    // Créer l'utilisateur
    const [userRes] = await pool.execute<OkPacket>(
      `INSERT INTO users
         (tenant_id, first_name, last_name, email, password_hash, phone, role,
          email_verification_token, email_verification_expires)
       VALUES (?, ?, ?, ?, ?, ?, 'client', ?, ?)`,
      [tenantId, firstName, lastName, email, passwordHash, phone ?? null, verificationOtp, otpExpires]
    )
    const userId = userRes.insertId

    const tokens = makeTokens(userId, tenantId, email, 'client')
    await storeRefreshToken(userId, tokens.refreshToken)
    await logAudit(userId, tenantId, 'USER_REGISTER', ip, { email })

    // Envoi OTP par email — fire & forget (on ne bloque pas l'inscription si ça rate)
    sendOtpEmail({ to: email, firstName, otp: verificationOtp }).catch((err) =>
      console.error('[mailer] sendOtpEmail failed:', err)
    )

    const user: User = {
      id: userId,
      tenantId,
      email,
      firstName,
      lastName,
      phone: phone ?? null,
      role: 'client',
      isActive: true,
      isEmailVerified: false,
      emailVerifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }

    return { user, tokens }
  },

  async login(
    email: string,
    password: string,
    ip?: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.*, t.is_active AS tenant_active
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [email]
    )
    const row = rows[0]

    // Message volontairement identique pour éviter l'énumération d'emails
    if (!row) fail('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS')
    if (!row.is_active) fail('Compte désactivé', 403, 'ACCOUNT_DISABLED')
    if (!row.tenant_active) fail('Organisation désactivée', 403, 'TENANT_DISABLED')

    const match = await bcrypt.compare(password, row.password_hash)
    if (!match) {
      await logAudit(row.id, row.tenant_id, 'LOGIN_FAILED', ip, { email })
      fail('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS')
    }

    if (!row.is_email_verified) {
      fail('Veuillez vérifier votre email avant de vous connecter', 403, 'EMAIL_NOT_VERIFIED')
    }

    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [row.id])

    const tokens = makeTokens(row.id, row.tenant_id, row.email, row.role)
    await storeRefreshToken(row.id, tokens.refreshToken)
    await logAudit(row.id, row.tenant_id, 'LOGIN_SUCCESS', ip, { email })

    return { user: mapRowToUser(row), tokens }
  },

  async refreshToken(token: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(token)
    if (!payload) fail('Token invalide ou expiré', 401, 'INVALID_TOKEN')

    const tokenHash = hashData(token)
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, user_id FROM refresh_tokens WHERE token_hash = ? AND is_revoked = 0 AND expires_at > NOW() LIMIT 1',
      [tokenHash]
    )
    if (rows.length === 0) fail('Token révoqué ou expiré', 401, 'TOKEN_REVOKED')

    const [userRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, tenant_id, email, role, is_active FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [payload.id]
    )
    const user = userRows[0]
    if (!user || !user.is_active) fail('Compte désactivé', 403, 'ACCOUNT_DISABLED')

    // Rotation du token
    await pool.execute('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [tokenHash])

    const newTokens = makeTokens(user.id, user.tenant_id, user.email, user.role)
    await storeRefreshToken(user.id, newTokens.refreshToken)

    return newTokens
  },

  async logout(userId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = hashData(refreshToken)
      await pool.execute(
        'UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ? AND user_id = ?',
        [tokenHash, userId]
      )
    } else {
      // Révoque toutes les sessions de l'utilisateur
      await pool.execute('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?', [userId])
    }
    await logAudit(userId, null, 'LOGOUT')
  },

  async forgotPassword(email: string, ip?: string): Promise<void> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, tenant_id, first_name FROM users WHERE email = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1',
      [email]
    )
    const user = rows[0]
    // Retour silencieux — ne pas révéler si l'email existe
    if (!user) return

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

    await pool.execute(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [resetToken, expiresAt, user.id]
    )
    await logAudit(user.id, user.tenant_id, 'FORGOT_PASSWORD', ip, { email })

    // Envoi lien reset password — fire & forget
    sendResetPasswordEmail({ to: email, firstName: user.first_name, resetToken }).catch((err) =>
      console.error('[mailer] sendResetPasswordEmail failed:', err.message)
    )
  },

  async resetPassword(token: string, newPassword: string, ip?: string): Promise<void> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, tenant_id FROM users
       WHERE password_reset_token = ? AND password_reset_expires > NOW() AND deleted_at IS NULL
       LIMIT 1`,
      [token]
    )
    const user = rows[0]
    if (!user) fail('Token invalide ou expiré', 400, 'INVALID_TOKEN')

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

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
    // Force la reconnexion sur tous les appareils
    await pool.execute('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?', [user.id])
    await logAudit(user.id, user.tenant_id, 'RESET_PASSWORD', ip)
  },

  // Vérification par lien email (GET /verify-email/:token)
  async verifyEmail(token: string, ip?: string): Promise<void> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, tenant_id FROM users WHERE email_verification_token = ? AND deleted_at IS NULL LIMIT 1',
      [token]
    )
    const user = rows[0]
    if (!user) fail('Lien de vérification invalide', 400, 'INVALID_TOKEN')

    await pool.execute(
      'UPDATE users SET is_email_verified = 1, email_verified_at = NOW(), email_verification_token = NULL WHERE id = ?',
      [user.id]
    )
    await logAudit(user.id, user.tenant_id, 'EMAIL_VERIFIED', ip)
  },

  // Vérification par code OTP (POST /verify-otp — depuis VerifyEmailPage)
  // Accepte email + code — pas besoin d'être authentifié
  async verifyOtp(email: string, code: string, ip?: string): Promise<{ user: User; tokens: AuthTokens }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, tenant_id, role, email_verification_token, email_verification_expires
       FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [email]
    )
    const row = rows[0]

    if (!row) fail('Utilisateur introuvable', 404, 'USER_NOT_FOUND')

    if (!row.email_verification_token || row.email_verification_token !== code) {
      fail('Code de vérification incorrect', 400, 'INVALID_OTP')
    }

    // Vérification expiry — 2 minutes
    if (!row.email_verification_expires || new Date(row.email_verification_expires) < new Date()) {
      fail('Code expiré. Veuillez demander un nouveau code.', 400, 'OTP_EXPIRED')
    }

    await pool.execute(
      `UPDATE users
       SET is_email_verified = 1, email_verified_at = NOW(),
           email_verification_token = NULL, email_verification_expires = NULL
       WHERE id = ?`,
      [row.id]
    )
    await logAudit(row.id, row.tenant_id, 'EMAIL_VERIFIED_OTP', ip)

    // Auto-login après vérification
    const [userRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [row.id]
    )
    const fullUser = userRows[0]
    const tokens = makeTokens(fullUser.id, fullUser.tenant_id, fullUser.email, fullUser.role)
    await storeRefreshToken(fullUser.id, tokens.refreshToken)

    return { user: mapRowToUser(fullUser), tokens }
  },

  // Renvoi d'un nouveau code OTP (bouton "Renvoyer" sur VerifyEmailPage)
  async resendOtp(email: string, ip?: string): Promise<void> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, tenant_id, first_name, is_email_verified
       FROM users WHERE email = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1`,
      [email]
    )
    const user = rows[0]
    if (!user) fail('Utilisateur introuvable', 404, 'USER_NOT_FOUND')
    if (user.is_email_verified) fail('Email déjà vérifié', 400, 'ALREADY_VERIFIED')

    const newOtp = generateOtp(6)
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000)

    await pool.execute(
      'UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?',
      [newOtp, otpExpires, user.id]
    )
    await logAudit(user.id, user.tenant_id, 'OTP_RESENT', ip, { email })

    sendOtpEmail({ to: email, firstName: user.first_name, otp: newOtp }).catch((err) =>
      console.error('[mailer] resendOtp failed:', err)
    )
  },

  async getMe(userId: number): Promise<User> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, tenant_id, first_name, last_name, email, phone, role,
              is_active, email_verified_at, created_at, updated_at, deleted_at
       FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [userId]
    )
    const row = rows[0]
    if (!row) fail('Utilisateur introuvable', 404, 'USER_NOT_FOUND')
    return mapRowToUser(row)
  },
}
