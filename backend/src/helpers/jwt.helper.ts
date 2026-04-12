import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types/auth.types'

const ACCESS_SECRET = process.env.JWT_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  // cast needed: @types/jsonwebtoken uses branded StringValue for expiresIn
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as unknown as number,
  })
}

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as unknown as number,
  })
}

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload
  } catch {
    return null
  }
}
