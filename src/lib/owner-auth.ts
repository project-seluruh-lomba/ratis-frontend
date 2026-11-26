import { AuthError } from './auth'

export type OwnerStoreStatus = 'pending' | 'ditolak' | 'aktif' | 'nonaktif'

export type OwnerSession = {
  email: string
  name: string
  storeName: string
  storeStatus: OwnerStoreStatus
  loginAt: string
}

type OwnerAccount = {
  email: string
  password: string
  name: string
  storeName: string
  storeStatus: OwnerStoreStatus
}

const SESSION_KEY = 'ratis.owner.session'
const ACCOUNTS_KEY = 'ratis.owner.accounts'

const DEMO_OWNER_ACCOUNT: OwnerAccount = {
  email: 'warungmadura@warungmadura.com',
  password: 'password',
  name: 'Pemilik Warung Madura',
  storeName: 'Warung Madura',
  storeStatus: 'aktif',
}

function isOwnerStoreStatus(value: unknown): value is OwnerStoreStatus {
  return (
    value === 'pending' ||
    value === 'ditolak' ||
    value === 'aktif' ||
    value === 'nonaktif'
  )
}

function parseSession(raw: string | null): OwnerSession | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<OwnerSession>
    if (typeof parsed.email !== 'string' || typeof parsed.name !== 'string') return null

    return {
      email: parsed.email,
      name: parsed.name,
      storeName: typeof parsed.storeName === 'string' ? parsed.storeName : 'Toko Anda',
      storeStatus: isOwnerStoreStatus(parsed.storeStatus) ? parsed.storeStatus : 'aktif',
      loginAt: typeof parsed.loginAt === 'string' ? parsed.loginAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function parseAccount(raw: unknown): OwnerAccount | null {
  if (!raw || typeof raw !== 'object') return null

  const account = raw as Partial<OwnerAccount>
  if (
    typeof account.email !== 'string' ||
    typeof account.password !== 'string' ||
    typeof account.name !== 'string' ||
    typeof account.storeName !== 'string'
  ) {
    return null
  }

  return {
    email: account.email.toLowerCase(),
    password: account.password,
    name: account.name,
    storeName: account.storeName,
    storeStatus: isOwnerStoreStatus(account.storeStatus) ? account.storeStatus : 'pending',
  }
}

function getRegisteredAccounts(): OwnerAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .map(parseAccount)
      .filter((account): account is OwnerAccount => account !== null)
  } catch {
    return []
  }
}

function saveRegisteredAccounts(accounts: OwnerAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {
    throw new AuthError(
      'unknown',
      'Data akun tidak dapat disimpan di perangkat ini. Periksa pengaturan penyimpanan browser.',
    )
  }
}

function toSession(account: OwnerAccount): OwnerSession {
  return {
    email: account.email,
    name: account.name,
    storeName: account.storeName,
    storeStatus: account.storeStatus,
    loginAt: new Date().toISOString(),
  }
}

export function getOwnerSession(): OwnerSession | null {
  const local = parseSession(localStorage.getItem(SESSION_KEY))
  if (local) return local

  return parseSession(sessionStorage.getItem(SESSION_KEY))
}

export function saveOwnerSession(session: OwnerSession, remember: boolean) {
  clearOwnerSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearOwnerSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

type OwnerLoginInput = {
  email: string
  password: string
}

export async function loginOwner({ email, password }: OwnerLoginInput): Promise<OwnerSession> {
  await new Promise((resolve) => setTimeout(resolve, 900))

  const normalizedEmail = email.trim().toLowerCase()
  const account = [DEMO_OWNER_ACCOUNT, ...getRegisteredAccounts()].find(
    (item) => item.email === normalizedEmail,
  )

  if (!account || account.password !== password) {
    throw new AuthError('invalid-credentials', 'Email atau kata sandi tidak sesuai.')
  }

  if (account.storeStatus === 'nonaktif') {
    throw new AuthError(
      'account-disabled',
      'Akun Anda dinonaktifkan. Hubungi admin Ratis untuk memulihkan akses.',
    )
  }

  return toSession(account)
}

export type RegisterOwnerInput = {
  ownerName: string
  email: string
  phone: string
  password: string
  storeName: string
  storeDescription: string
  storeAddress: string
  nib: string
}

export async function registerOwner({
  ownerName,
  email,
  phone,
  password,
  storeName,
  storeDescription,
  storeAddress,
  nib,
}: RegisterOwnerInput): Promise<OwnerSession> {
  await new Promise((resolve) => setTimeout(resolve, 1100))

  const normalizedEmail = email.trim().toLowerCase()
  const registeredAccounts = getRegisteredAccounts()
  const isDuplicate =
    normalizedEmail === DEMO_OWNER_ACCOUNT.email ||
    registeredAccounts.some((account) => account.email === normalizedEmail)

  if (isDuplicate) {
    throw new AuthError(
      'email-taken',
      'Email sudah terdaftar. Masuk atau gunakan email lain.',
    )
  }

  const account: OwnerAccount = {
    email: normalizedEmail,
    password,
    name: ownerName.trim(),
    storeName: storeName.trim(),
    storeStatus: 'pending',
  }

  saveRegisteredAccounts([...registeredAccounts, account])

  void phone
  void storeDescription
  void storeAddress
  void nib

  return toSession(account)
}
