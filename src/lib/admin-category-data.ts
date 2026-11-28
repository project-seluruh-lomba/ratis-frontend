import { categoriesApi } from './api/services'
import type { Category } from './api/types'

export type CategoryStatus = 'aktif' | 'nonaktif'
export type CategoryIconKey =
  | 'kuliner' | 'kriya' | 'fashion' | 'minuman' | 'herbal' | 'sembako' | 'elektronik' | 'dekorasi' | 'bayi'
  | 'pertanian' | 'peternakan' | 'aksesoris' | 'ibadah' | 'otomotif' | 'alat-tulis' | 'jasa' | 'furnitur' | 'logam' | 'lainnya'

export type CategoryRecord = {
  id: string
  name: string
  description: string
  slug: string
  productCount: number
  createdAt: string
  updatedAt: string
  status: CategoryStatus
  icon: CategoryIconKey
}

function iconFor(name: string): CategoryIconKey {
  const n = name.toLowerCase()
  if (n.includes('kuliner') || n.includes('makan')) return 'kuliner'
  if (n.includes('minum') || n.includes('kopi')) return 'minuman'
  if (n.includes('fashion') || n.includes('batik') || n.includes('pakaian')) return 'fashion'
  if (n.includes('kriya') || n.includes('kerajinan')) return 'kriya'
  if (n.includes('herbal') || n.includes('kesehat')) return 'herbal'
  if (n.includes('sembako') || n.includes('bahan')) return 'sembako'
  return 'lainnya'
}

export function mapCategory(c: Category): CategoryRecord {
  return {
    id: c.id, name: c.name, description: '', slug: c.slug, productCount: c.productCount,
    createdAt: c.createdAt, updatedAt: c.createdAt, status: c.isActive ? 'aktif' : 'nonaktif', icon: iconFor(c.name),
  }
}

export async function fetchCategories(q?: string) { return (await categoriesApi.list(q)).map(mapCategory) }
export async function createCategory(name: string) { return mapCategory(await categoriesApi.create(name)) }
export async function updateCategory(id: string, body: { name?: string; status?: CategoryStatus }) {
  return mapCategory(await categoriesApi.update(id, { name: body.name, isActive: body.status ? body.status === 'aktif' : undefined }))
}
export async function deleteCategory(id: string) { await categoriesApi.remove(id) }

export function slugifyCategoryName(name: string) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'dan').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')
}
