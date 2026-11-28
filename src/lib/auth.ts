import { authApi } from './api/services'

export type AdminRole = 'ADMIN'

export type AdminSession = {
  email: string
  name: string
  role: AdminRole
  loginAt: string
  token: string
  id: string
}

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'account-disabled'
  | 'forbidden'
  | 'rate-limited'
  | 'email-taken'
  | 'network'
  | 'unknown'

export class AuthError extends Error {
  code: AuthErrorCode
  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

const SESSION_KEY = 'ratis.admin.session'
const REMEMBER_KEY = 'ratis.admin.remember'

function parseSession(raw: string | null): AdminSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>
    if (typeof parsed.email !== 'string' || typeof parsed.name !== 'string' || typeof parsed.token !== 'string') return null
    if (parsed.role !== 'ADMIN') return null
    return {
      id: typeof parsed.id === 'string' ? parsed.id : '',
      email: parsed.email,
      name: parsed.name,
      role: 'ADMIN',
      loginAt: typeof parsed.loginAt === 'string' ? parsed.loginAt : new Date().toISOString(),
      token: parsed.token,
    }
  } catch {
    return null
  }
}

export function getAdminSession(): AdminSession | null {
  return parseSession(localStorage.getItem(SESSION_KEY)) || parseSession(sessionStorage.getItem(SESSION_KEY))
}

export function getAdminToken(): string | null {
  return getAdminSession()?.token ?? null
}

export function saveAdminSession(session: AdminSession, remember: boolean) {
  clearAdminSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
}

export function isRemembered(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === '1'
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

export async function loginAdmin({ email, password }: { email: string; password: string }): Promise<AdminSession> {
  try {
    const data = await authApi.login({ email, password })
    if (data.user.role !== 'ADMIN') {
      throw new AuthError('forbidden', 'Akses ditolak. Halaman ini khusus akun admin.')
    }
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: 'ADMIN',
      loginAt: new Date().toISOString(),
      token: data.accessToken,
    }
  } catch (err: any) {
    const status = err?.response?.status || err?.statusCode
    const msg = err?.userMessage || err?.response?.data?.message || 'Gagal masuk'
    if (status === 401) throw new AuthError('invalid-credentials', msg)
    if (status === 403) throw new AuthError('account-disabled', msg)
    if (err instanceof AuthError) throw err
    if (status === 429) throw new AuthError('rate-limited', msg)
    throw new AuthError('unknown', msg)
  }
}
