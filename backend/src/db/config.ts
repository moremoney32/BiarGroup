import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'biar_cpaas',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
})

export const connectDB = async (): Promise<void> => {
  const conn = await pool.getConnection()
  console.log('MySQL connected')
  conn.release()
}
