import { shopsApi } from './api/services'
import type { ShopListItem, ShopStatus } from './api/types'

export type UmkmStatus = ShopStatus
export type UmkmAvatarTone = 'teal' | 'emerald' | 'lavender' | 'rose' | 'slate'

export type UmkmRecord = {
  id: string
  slug: string
  name: string
  owner: string
  email: string
  phone: string
  registeredAt: string
  status: UmkmStatus
  avatarTone: UmkmAvatarTone
  isNew?: boolean
}

export type UmkmAuditTone = 'warning' | 'success' | 'neutral'

export type UmkmAuditEvent = {
  id: string
  title: string
  at: string
  description: string
  statusLabel?: string
  context?: string
  tone: UmkmAuditTone
}

export type UmkmProductPreview = {
  name: string
  price: string
}

export type UmkmDetail = {
  record: UmkmRecord
  shopId: string
  category: string
  region: string
  description: string
  address: string
  coordinates: string
  photoLabel: string
  photoUrl: string | null
  nib: string | null
  ownerNik: string
  ownerCity: string
  productSkus: number
  ordersProcessed: number
  productPreviews: UmkmProductPreview[]
  auditTrail: UmkmAuditEvent[]
}

const tones: UmkmAvatarTone[] = ['teal', 'emerald', 'lavender', 'rose', 'slate']
const toneByStatus: Record<UmkmStatus, UmkmAvatarTone> = { pending: 'teal', aktif: 'lavender', ditolak: 'rose', nonaktif: 'slate' }

export function toneForRecord(id: string, status: UmkmStatus): UmkmAvatarTone {
  const idx = Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % tones.length
  return status === 'pending' ? tones[idx] : toneByStatus[status]
}

export function mapShopToRecord(s: ShopListItem): UmkmRecord {
  const isNew = s.status === 'pending' && Date.now() - new Date(s.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000
  return {
    id: s.id,
    slug: s.slug || s.id,
    name: s.name,
    owner: s.owner?.name ?? '-',
    email: s.owner?.email ?? '-',
    phone: s.phone ?? '-',
    registeredAt: s.createdAt,
    status: s.status,
    avatarTone: toneForRecord(s.id, s.status),
    isNew,
  }
}

export async function fetchUmkmRecords(params: { status?: UmkmStatus | ''; q?: string; page?: number; limit?: number }) {
  const res = await shopsApi.list({
    status: params.status || undefined,
    q: params.q || undefined,
    page: params.page,
    limit: params.limit,
  })
  return { records: res.data.map(mapShopToRecord), meta: res.meta }
}

export async function fetchUmkmDetail(idOrSlug: string): Promise<UmkmDetail | undefined> {
  let shop
  try {
    shop = await shopsApi.detail(idOrSlug)
  } catch {
    const res = await shopsApi.list({ q: idOrSlug, limit: 50 })
    const found = res.data.find((s) => s.id === idOrSlug || s.slug === idOrSlug)
    if (!found) return undefined
    shop = await shopsApi.detail(found.id)
  }
  const record = mapShopToRecord(shop)
  const history: UmkmAuditEvent[] = (shop.statusHistory ?? []).map((h) => ({
    id: h.id,
    title:
      h.toStatus === 'aktif' ? 'Toko Disetujui/Diaktifkan' :
      h.toStatus === 'ditolak' ? 'Pendaftaran Ditolak' :
      h.toStatus === 'nonaktif' ? 'Toko Dinonaktifkan' :
      'Status Diperbarui',
    at: h.createdAt,
    description: h.reason || `Perubahan status dari ${h.fromStatus ?? 'baru'} menjadi ${h.toStatus}.`,
    statusLabel: `Status: ${h.toStatus}`,
    context: h.changedBy?.name ? `Admin: ${h.changedBy.name}` : undefined,
    tone: h.toStatus === 'aktif' ? 'success' : h.toStatus === 'ditolak' ? 'warning' : 'neutral',
  }))
  if (history.length === 0) {
    history.push({
      id: `${shop.id}-registered`,
      title: 'Pendaftaran Toko Diterima',
      at: shop.createdAt,
      description: `Toko didaftarkan oleh pemilik ${shop.owner?.name ?? '-'}.`,
      statusLabel: `Status: ${shop.status}`,
      tone: 'warning',
    })
  }
  return {
    record,
    shopId: shop.id,
    category: '-',
    region: '-',
    description: shop.description || '-',
    address: shop.address || '-',
    coordinates: '',
    photoLabel: shop.photoUrl ? 'Foto Usaha' : 'Tidak diisi (opsional)',
    photoUrl: shop.photoUrl ?? null,
    nib: shop.nib ?? null,
    ownerNik: '-',
    ownerCity: '-',
    productSkus: shop.summary?.productCount ?? 0,
    ordersProcessed: shop.summary?.orderCount ?? 0,
    productPreviews: [],
    auditTrail: history.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
  }
}

export async function approveUmkm(id: string) { return shopsApi.approve(id) }
export async function rejectUmkm(id: string, reason: string) { return shopsApi.reject(id, reason) }
export async function setUmkmStatus(id: string, status: 'aktif' | 'nonaktif', reason?: string) { return shopsApi.updateStatus(id, status, reason) }

// Legacy exports kept for non-migrated pages
export const umkmRecords: UmkmRecord[] = []
export function applyUmkmStatusOverrides(records: UmkmRecord[]) { return records }
export function persistUmkmStatus(_slug: string, _status: UmkmStatus) { /* noop: use API */ }
export function getUmkmDetail(_slug: string): UmkmDetail | undefined { return undefined }

