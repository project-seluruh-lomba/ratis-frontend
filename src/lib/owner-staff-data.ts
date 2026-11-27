export type StaffRole =
  | 'Kasir & Layanan Pesanan'
  | 'Koordinator Dapur & Stok'
  | 'Packing & Kurir Hand-off'
  | 'Packing & Ekspedisi Kurir'
  | 'Staf Magang Dapur (Eks)'

export type AccessModule =
  | 'Pesanan'
  | 'POS Kasir'
  | 'Chat Pelanggan'
  | 'Penyesuaian Stok'
  | 'Opname Bahan'
  | 'Cetak Resi'
  | 'Status Kirim'

export type StaffStatus = 'Aktif' | 'Nonaktif'
export type StaffAvatarColor = 'green' | 'blue' | 'gray'
export type StaffShiftId = 'pagi' | 'sore' | 'fleksibel'

export type StaffMember = {
  id: string
  name: string
  email: string
  phone: string
  avatarColor: StaffAvatarColor
  avatarInitials: string
  role: StaffRole
  access: AccessModule[]
  lastActive: string
  lastActiveDevice: string
  status: StaffStatus
  shiftId?: StaffShiftId
  workDays?: string[]
  branch?: string
  internalNote?: string
}

export type StaffRoleOption = {
  role: StaffRole
  badge: string
  description: string
  access: AccessModule[]
}

export const staffQuota = 5

export const staffShiftOptions: {
  id: StaffShiftId
  name: string
  range: string
  description: string
}[] = [
  {
    id: 'pagi',
    name: 'Shift Pagi',
    range: '07.30 - 15.30',
    description: 'Fokus buka warung, prep sarapan, & peak makan siang.',
  },
  {
    id: 'sore',
    name: 'Shift Sore',
    range: '13.00 - 21.00',
    description: 'Layanan makan malam, rekap closing kasir, & tutup toko.',
  },
  {
    id: 'fleksibel',
    name: 'Shift Penuh / Fleksibel',
    range: '08.00 - 18.00',
    description: 'Khusus hari perayaan katering atau pengganti rotasi.',
  },
]

export const staffWorkDayOptions = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
]

export function formatStaffWorkDays(days?: string[]) {
  const selected = days && days.length > 0 ? days : staffWorkDayOptions.slice(0, 6)

  if (selected.length === 7) return 'Setiap hari'
  if (selected.length === 6 && selected[0] === 'Senin' && selected[5] === 'Sabtu') {
    return 'Senin - Sabtu'
  }
  if (selected.length === 5 && selected[0] === 'Senin' && selected[4] === 'Jumat') {
    return 'Senin - Jumat'
  }

  return selected.join(', ')
}

export const staffRoleOptions: StaffRoleOption[] = [
  {
    role: 'Kasir & Layanan Pesanan',
    badge: 'Rekomendasi Shift Depan',
    description:
      'Menerima pesanan baru, cetak struk POS bluetooth, melayani QRIS statis di meja kasir, dan menyelesaikan transaksi pembeli.',
    access: ['Pesanan', 'POS Kasir', 'Chat Pelanggan'],
  },
  {
    role: 'Koordinator Dapur & Stok',
    badge: 'Produksi & Bahan',
    description:
      'Opname sisa bahan harian (beras, ayam, bumbu), update porsi siap jual, dan menandai menu habis (*sold-out*) saat jam sibuk.',
    access: ['Penyesuaian Stok', 'Opname Bahan', 'Pesanan'],
  },
  {
    role: 'Packing & Ekspedisi Kurir',
    badge: 'Handover Pengiriman',
    description:
      'Cetak label alamat katering, validasi nomor resi kurir instan (GoSend / GrabExpress / Paxel), dan dokumentasi foto serah-terima.',
    access: ['Pesanan', 'Cetak Resi', 'Status Kirim'],
  },
]

export const initialStaffData: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Rina Setyowati',
    email: 'rina.dapurbusari@gmail.com',
    phone: '0813-8821-4901',
    avatarColor: 'green',
    avatarInitials: 'RS',
    role: 'Kasir & Layanan Pesanan',
    access: ['Pesanan', 'POS Kasir', 'Chat Pelanggan'],
    lastActive: 'Sedang Aktif (10 mnt lalu)',
    lastActiveDevice: 'Web Kasir POS',
    status: 'Aktif',
  },
  {
    id: 'staff-2',
    name: 'Budi Pratama',
    email: 'budi.dapurbusari@gmail.com',
    phone: '0857-1192-3400',
    avatarColor: 'blue',
    avatarInitials: 'BP',
    role: 'Koordinator Dapur & Stok',
    access: ['Penyesuaian Stok', 'Opname Bahan', 'Pesanan'],
    lastActive: 'Hari ini, 12:10 WIB',
    lastActiveDevice: 'Android Tablet Dapur',
    status: 'Aktif',
  },
  {
    id: 'staff-3',
    name: 'Siti Rahma',
    email: 'siti.dapurbusari@gmail.com',
    phone: '0812-9901-2245',
    avatarColor: 'blue',
    avatarInitials: 'SR',
    role: 'Packing & Kurir Hand-off',
    access: ['Pesanan', 'Cetak Resi', 'Status Kirim'],
    lastActive: 'Hari ini, 11:30 WIB',
    lastActiveDevice: 'Mobile App Staf',
    status: 'Aktif',
  },
  {
    id: 'staff-4',
    name: 'Dimas Anggara',
    email: 'dimas.anggara.old@gmail.com',
    phone: '0819-3320-1188',
    avatarColor: 'gray',
    avatarInitials: 'DA',
    role: 'Staf Magang Dapur (Eks)',
    access: ['Pesanan'],
    lastActive: '18 Mei 2026',
    lastActiveDevice: '',
    status: 'Nonaktif',
  },
]

const staffStore: StaffMember[] = [...initialStaffData]

export const staffStatusMeta: Record<StaffStatus, { badge: string; dot: string }> = {
  Aktif: { badge: 'bg-[#dcfce7] text-[#15803d]', dot: 'bg-[#22c55e]' },
  Nonaktif: { badge: 'bg-[#e2e8f0] text-[#475569]', dot: 'bg-slate-400' },
}

export const staffAvatarMeta: Record<StaffAvatarColor, string> = {
  green: 'bg-[#d7f5e9] text-primary',
  blue: 'bg-[#e2ecff] text-[#3b5bdb]',
  gray: 'bg-[#e2e8f0] text-slate-500',
}

export function getOwnerStaff(): StaffMember[] {
  return [...staffStore]
}

export function addOwnerStaff(staff: StaffMember) {
  staffStore.unshift(staff)
}

export function updateOwnerStaff(
  id: string,
  updates: Partial<
    Pick<
      StaffMember,
      | 'name'
      | 'phone'
      | 'avatarInitials'
      | 'role'
      | 'shiftId'
      | 'workDays'
      | 'branch'
      | 'internalNote'
    >
  >,
) {
  const index = staffStore.findIndex((staff) => staff.id === id)
  if (index >= 0) {
    staffStore[index] = { ...staffStore[index], ...updates }
  }
}

export function updateOwnerStaffStatus(id: string, status: StaffStatus) {
  const index = staffStore.findIndex((staff) => staff.id === id)
  if (index >= 0) {
    staffStore[index] = { ...staffStore[index], status }
  }
}

export function isStaffEmailTaken(email: string) {
  const normalized = email.trim().toLowerCase()
  return staffStore.some((staff) => staff.email.trim().toLowerCase() === normalized)
}

export function getActiveStaffCount() {
  return staffStore.filter((staff) => staff.status === 'Aktif').length
}

export function getAvailableStaffSlots() {
  return Math.max(0, staffQuota - getActiveStaffCount())
}

export function getRoleAccess(role: StaffRole): AccessModule[] {
  const option = staffRoleOptions.find((item) => item.role === role)
  return option ? [...option.access] : ['Pesanan']
}
