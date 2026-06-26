/**
 * Seed : crée le tenant BIAR GROUP + un compte super_admin
 * Usage : npm run seed:admin
 * ⚠️  À n'exécuter qu'une seule fois (idempotent — ne duplique pas si déjà existant)
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { pool } from '../config'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

// ── Credentials du super_admin à créer ──────────────────────
const SUPER_ADMIN = {
  firstName: 'Franck',
  lastName:  'Ngongang',
  email:     'francklionelngongangtchouta@gmail.com',
  password:  'BiarAdmin2026!',   // change ce mot de passe via l'interface après connexion
  phone:     '+237693332788',
}

const PLATFORM_TENANT = {
  name: 'BIAR GROUP AFRICA',
  slug: 'biar-group',
  plan: 'enterprise' as const,
}

async function run() {
  console.log('🌱 Seed super_admin — BIAR GROUP AFRICA\n')

  // 1. Créer le tenant plateforme si absent
  const [existingTenants] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM tenants WHERE slug = ?',
    [PLATFORM_TENANT.slug]
  )

  let tenantId: number

  if (existingTenants.length > 0) {
    tenantId = existingTenants[0].id as number
    console.log(`✅ Tenant existant — id: ${tenantId} (${PLATFORM_TENANT.name})`)
  } else {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO tenants (name, slug, plan, is_active) VALUES (?, ?, ?, 1)',
      [PLATFORM_TENANT.name, PLATFORM_TENANT.slug, PLATFORM_TENANT.plan]
    )
    tenantId = result.insertId
    console.log(`✅ Tenant créé — id: ${tenantId} (${PLATFORM_TENANT.name})`)
  }

  // 2. Vérifier si un user avec cet email existe déjà (dans n'importe quel tenant)
  const [existingUsers] = await pool.execute<RowDataPacket[]>(
    'SELECT id, email, role, tenant_id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [SUPER_ADMIN.email]
  )

  if (existingUsers.length > 0) {
    const existing = existingUsers[0]
    // Upgrader le rôle et s'assurer que le compte est actif et vérifié
    await pool.execute(
      `UPDATE users
       SET role = 'super_admin', is_active = 1, is_email_verified = 1,
           email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
       WHERE id = ?`,
      [existing.id]
    )
    console.log(`✅ Utilisateur existant upgradé en super_admin — id: ${existing.id as number} (était: ${existing.role as string})`)
    console.log('\n════════════════════════════════════════')
    console.log('  Connecte-toi avec :')
    console.log(`  Email    : ${SUPER_ADMIN.email}`)
    console.log('  Password : ton mot de passe habituel (inchangé)')
    console.log('════════════════════════════════════════\n')
    await pool.end()
    return
  }

  // 3. Sinon créer un nouveau super_admin
  const passwordHash = await bcrypt.hash(SUPER_ADMIN.password, 12)

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users
       (tenant_id, first_name, last_name, email, password_hash, phone,
        role, is_active, is_email_verified, email_verified_at)
     VALUES (?, ?, ?, ?, ?, ?, 'super_admin', 1, 1, NOW())`,
    [tenantId, SUPER_ADMIN.firstName, SUPER_ADMIN.lastName,
     SUPER_ADMIN.email, passwordHash, SUPER_ADMIN.phone]
  )

  console.log(`✅ Super admin créé — id: ${result.insertId}`)
  console.log('\n════════════════════════════════════════')
  console.log('  Credentials de connexion :')
  console.log(`  Email    : ${SUPER_ADMIN.email}`)
  console.log(`  Password : ${SUPER_ADMIN.password}`)
  console.log('  ⚠️  Change ce mot de passe après la première connexion !')
  console.log('════════════════════════════════════════\n')

  await pool.end()
}

run().catch(err => {
  console.error('❌ Erreur seed :', err)
  process.exit(1)
})
