export type AdminRole = 'SUPERADMIN' | 'VERIFIKATOR'

export type AdminSession = {
  email: string
  name: string
  role: AdminRole
  loginAt: string
}

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'account-disabled'
  | 'rate-limited'
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
const ADMIN_EMAIL_PATTERN = /^[^\s@]+@ratis\.id$/i

function parseSession(raw: string | null): AdminSession | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>
    if (typeof parsed.email !== 'string' || typeof parsed.name !== 'string') return null

    return {
      email: parsed.email,
      name: parsed.name,
      role: parsed.role === 'VERIFIKATOR' ? 'VERIFIKATOR' : 'SUPERADMIN',
      loginAt: typeof parsed.loginAt === 'string' ? parsed.loginAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function getAdminSession(): AdminSession | null {
  const local = parseSession(localStorage.getItem(SESSION_KEY))
  if (local) return local

  return parseSession(sessionStorage.getItem(SESSION_KEY))
}

export function saveAdminSession(session: AdminSession, remember: boolean) {
  clearAdminSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

type LoginInput = {
  email: string
  password: string
}

export async function loginAdmin({ email, password }: LoginInput): Promise<AdminSession> {
  await new Promise((resolve) => setTimeout(resolve, 900))

  const normalizedEmail = email.trim().toLowerCase()

  if (!ADMIN_EMAIL_PATTERN.test(normalizedEmail)) {
    throw new AuthError('invalid-credentials', 'Email atau kata sandi tidak sesuai.')
  }

  if (normalizedEmail === 'nonaktif@ratis.id') {
    throw new AuthError(
      'account-disabled',
      'Akun Anda dinonaktifkan. Hubungi superadmin Ratis untuk memulihkan akses.',
    )
  }

  if (password.trim().length < 8) {
    throw new AuthError('invalid-credentials', 'Email atau kata sandi tidak sesuai.')
  }

  const isVerifikator = normalizedEmail.startsWith('verifikator')

  return {
    email: normalizedEmail,
    name: isVerifikator ? 'Verifikator Ratis' : 'Admin Ratis',
    role: isVerifikator ? 'VERIFIKATOR' : 'SUPERADMIN',
    loginAt: new Date().toISOString(),
  }
}
