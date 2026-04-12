import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex')

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export const decrypt = (encryptedText: string): string => {
  const [ivHex, dataHex] = encryptedText.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export const generateOtp = (length = 6): string => {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)]
  }
  return otp
}

export const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex')
}
