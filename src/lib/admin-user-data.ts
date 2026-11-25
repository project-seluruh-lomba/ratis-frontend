export type UserRole = 'admin' | 'pemilik' | 'staf' | 'pelanggan'
export type UserStatus = 'aktif' | 'nonaktif'

export type AdminUser = {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  storeName: string | null
  joinedAt: string
  lastActive: string
  verified: boolean
  online: boolean
  isCurrentAdmin: boolean
}

export const userRoleTotals: Record<UserRole, number> = {
  admin: 6,
  pemilik: 320,
  staf: 142,
  pelanggan: 2_372,
}

const stores = [
  'Warung Bu Sari',
  'Batik Sekar Wangi',
  'Kopi Nusantara Lestari',
  'Dapur Oma Elly',
  'Toko Berkah Jaya',
  'Madu Hutan Murni Riau',
  'Keripik Tempe Mbok Nem',
  'Anyaman Bambu Asri',
  'Rajut Ceria Nusantara',
  'Gula Aren Sejahtera',
  'Tenun Ikat Lestari',
  'Kopi Lereng Merapi',
]

const firstNames = [
  'Sri',
  'Sekar',
  'Bagus',
  'Dian',
  'Maya',
  'Agus',
  'Siti',
  'Budi',
  'Rina',
  'Dewi',
  'Ahmad',
  'Fitri',
  'Hendra',
  'Lestari',
  'Yoga',
  'Nur',
  'Rizky',
  'Putri',
  'Bambang',
  'Anita',
  'Fajar',
  'Indah',
  'Joko',
  'Kartika',
  'Lukman',
  'Mega',
  'Nanda',
  'Oki',
  'Prita',
  'Rudi',
  'Sari',
  'Taufik',
  'Umar',
  'Vina',
  'Wawan',
  'Yuni',
  'Zaki',
  'Ayu',
  'Bayu',
  'Citra',
]

const lastNames = [
  'Wahyuningsih',
  'Wijaya',
  'Pratama',
  'Saputra',
  'Handayani',
  'Kusuma',
  'Nugroho',
  'Santoso',
  'Lestari',
  'Hartono',
  'Setiawan',
  'Rahmawati',
  'Hidayat',
  'Permata',
  'Suryana',
  'Anggraini',
  'Firmansyah',
  'Maharani',
  'Sutanto',
  'Wulandari',
  'Halim',
  'Puspita',
  'Ramadhan',
  'Safitri',
  'Gunawan',
  'Ariani',
  'Maulana',
  'Novitasari',
  'Hakim',
  'Siregar',
]

const roleSuffix: Record<UserRole, string> = {
  admin: 'ADM',
  pemilik: 'SLL',
  staf: 'STF',
  pelanggan: 'CST',
}

const lastActiveLabels = [
  '2 menit lalu',
  '26 menit lalu',
  '1 jam lalu',
  '3 jam lalu',
  'Kemarin',
  '2 hari lalu',
  'Minggu ini',
  'Bulan ini',
]

const today = new Date()

function joinedAtFor(offset: number) {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
  return date.toISOString()
}

const seedUsers: AdminUser[] = [
  {
    id: 'USR-0001-ADM',
    name: 'Admin Ratis',
    email: 'superadmin@ratis.id',
    phone: '+62 811-2090-888',
    role: 'admin',
    status: 'aktif',
    storeName: null,
    joinedAt: '2025-02-14T09:12:00.000Z',
    lastActive: 'Sekarang',
    verified: true,
    online: true,
    isCurrentAdmin: true,
  },
  {
    id: 'USR-1082-SLL',
    name: 'Bu Sri Wahyuni',
    email: 'warungsri@gmail.com',
    phone: '+62 812-3344-5566',
    role: 'pemilik',
    status: 'aktif',
    storeName: 'Warung Bu Sari',
    joinedAt: '2025-04-02T03:24:00.000Z',
    lastActive: '12 menit lalu',
    verified: true,
    online: false,
    isCurrentAdmin: false,
  },
  {
    id: 'USR-0941-SLL',
    name: 'Sekar Wangi Pertiwi',
    email: 'order@batiksekar.id',
    phone: '+62 821-9988-1234',
    role: 'pemilik',
    status: 'aktif',
    storeName: 'Batik Sekar Wangi',
    joinedAt: '2025-06-21T07:45:00.000Z',
    lastActive: '1 jam lalu',
    verified: true,
    online: false,
    isCurrentAdmin: false,
  },
  {
    id: 'USR-2240-STF',
    name: 'Bagus Anugrah',
    email: 'kasir1@batiksekar.id',
    phone: '+62 837-1122-3344',
    role: 'staf',
    status: 'aktif',
    storeName: 'Batik Sekar Wangi',
    joinedAt: '2025-09-08T02:10:00.000Z',
    lastActive: '3 jam lalu',
    verified: true,
    online: false,
    isCurrentAdmin: false,
  },
  {
    id: 'USR-4412-CST',
    name: 'Dian Nugraha',
    email: 'dian.nugraha@yahoo.co.id',
    phone: '+62 813-7766-0099',
    role: 'pelanggan',
    status: 'aktif',
    storeName: null,
    joinedAt: '2026-01-17T11:02:00.000Z',
    lastActive: 'Kemarin',
    verified: true,
    online: false,
    isCurrentAdmin: false,
  },
  {
    id: 'USR-6031-CST',
    name: 'Maya Hapsari',
    email: 'mayahapsari@gmail.com',
    phone: '+62 899-0011-2233',
    role: 'pelanggan',
    status: 'aktif',
    storeName: null,
    joinedAt: '2026-03-05T05:38:00.000Z',
    lastActive: '2 hari lalu',
    verified: true,
    online: false,
    isCurrentAdmin: false,
  },
]

function buildGeneratedUsers() {
  const users: AdminUser[] = []
  const roles: UserRole[] = ['admin', 'pemilik', 'staf', 'pelanggan']
  let sequence = seedUsers.length

  for (const role of roles) {
    const existing = seedUsers.filter((user) => user.role === role).length
    const remaining = userRoleTotals[role] - existing

    for (let index = 0; index < remaining; index += 1) {
      const firstName = firstNames[(index * 3 + sequence) % firstNames.length]
      const lastName = lastNames[(index * 7 + sequence) % lastNames.length]
      const domain = sequence % 3 === 0 ? 'yahoo.co.id' : 'gmail.com'

      users.push({
        id: `USR-${String(1000 + ((sequence * 7) % 9000)).padStart(4, '0')}-${roleSuffix[role]}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${sequence}@${domain}`,
        phone: `+62 8${String(11 + ((sequence * 3) % 80)).padStart(2, '0')}-${String(
          1000 + ((sequence * 37) % 9000),
        )}-${String(1000 + ((sequence * 53) % 9000))}`,
        role,
        status: 'aktif',
        storeName:
          role === 'pemilik' || role === 'staf' ? stores[index % stores.length] : null,
        joinedAt: joinedAtFor(((sequence * 17) % 720) + 10),
        lastActive: lastActiveLabels[sequence % lastActiveLabels.length],
        verified: sequence % 11 !== 0,
        online: sequence % 41 === 0,
        isCurrentAdmin: false,
      })

      sequence += 1
    }
  }

  return users
}

const deactivatedIndexes = new Set([40, 130, 260, 420, 700, 980, 1320, 1750, 2200, 2650])

export const adminUsers: AdminUser[] = [...seedUsers, ...buildGeneratedUsers()].map(
  (user, index) => (deactivatedIndexes.has(index) ? { ...user, status: 'nonaktif' } : user),
)
