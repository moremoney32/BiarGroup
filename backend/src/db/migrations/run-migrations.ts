import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { pool } from '../config'

const MIGRATIONS_DIR = path.join(__dirname)

async function ensureMigrationsTable(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         INT          NOT NULL AUTO_INCREMENT,
      filename   VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migrations_filename (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

async function getAppliedMigrations(): Promise<string[]> {
  const [rows] = await pool.execute<any[]>(
    'SELECT filename FROM schema_migrations ORDER BY applied_at ASC'
  )
  return rows.map((r) => r.filename)
}

async function runMigration(filename: string, sql: string): Promise<void> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Découpe les statements sur les ";" en ignorant les vides et commentaires
    const statements = sql
      .split(';')
      .map((s) =>
        // retire les lignes de commentaires en tête de bloc
        s
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n')
          .trim()
      )
      .filter((s) => s.length > 0)

    for (const stmt of statements) {
      await conn.execute(stmt)
    }

    await conn.execute(
      'INSERT INTO schema_migrations (filename) VALUES (?)',
      [filename]
    )

    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

async function migrate(): Promise<void> {
  console.log('🚀 Running migrations...')

  await ensureMigrationsTable()
  const applied = await getAppliedMigrations()

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort() // tri alphabétique → 001_, 002_, etc.

  const pending = files.filter((f) => !applied.includes(f))

  if (pending.length === 0) {
    console.log('✅ Nothing to migrate — all up to date.')
    await pool.end()
    return
  }

  for (const file of pending) {
    const filepath = path.join(MIGRATIONS_DIR, file)
    const sql = fs.readFileSync(filepath, 'utf8')
    console.log(`  → Applying ${file}...`)
    await runMigration(file, sql)
    console.log(`  ✔ ${file} applied.`)
  }

  console.log(`✅ ${pending.length} migration(s) applied.`)
  await pool.end()
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
