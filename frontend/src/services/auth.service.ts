import apiFetch from './api'
import type { User } from '../types/auth.types'
import type { LoginFormData, RegisterFormData, ForgotPasswordFormData, ResetPasswordFormData } from '../features/auth/schemas/auth.schemas'

interface AuthData {
  user: User
  accessToken: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export const authService = {
  async login(data: LoginFormData): Promise<AuthData> {
    const res = await apiFetch.post<ApiResponse<AuthData>>('/auth/login', data)
    return res.data
  },

  async register(data: Omit<RegisterFormData, 'confirmPassword'>): Promise<AuthData> {
    const res = await apiFetch.post<ApiResponse<AuthData>>('/auth/register', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone ? data.phone.replace(/[\s\-().]/g, '') : undefined,
      tenantName: data.companyName,
      plan: data.plan ?? 'free',
    })
    return res.data
  },

  async logout(): Promise<void> {
    await apiFetch.post('/auth/logout')
  },

  async refreshToken(): Promise<string> {
    const res = await apiFetch.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token')
    return res.data.accessToken
  },

  async forgotPassword(data: ForgotPasswordFormData): Promise<void> {
    await apiFetch.post('/auth/forgot-password', data)
  },

  async resetPassword(data: ResetPasswordFormData): Promise<void> {
    await apiFetch.post('/auth/reset-password', {
      token: data.token,
      password: data.password,
    })
  },

  async resendOtp(email: string): Promise<void> {
    await apiFetch.post('/auth/resend-otp', { email })
  },

  async verifyOtp(email: string, code: string): Promise<AuthData> {
    const res = await apiFetch.post<ApiResponse<AuthData>>('/auth/verify-otp', { email, code })
    return res.data
  },

  async getMe(): Promise<User> {
    const res = await apiFetch.get<ApiResponse<{ user: User }>>('/auth/me')
    return res.data.user
  },
}
