export type OwnerOrderStatus = 'pending' | 'diproses' | 'siap' | 'selesai' | 'dibatalkan'

export type OwnerOrderPaymentStatus = 'lunas' | 'belum' | 'batal'

export type OwnerOrderFulfillment = 'ambil' | 'kurir-instan' | 'kurir-toko' | 'dikirim'

export type OwnerOrderItem = {
  name: string
  qty: number
  unitPrice: number
  note?: string
}

export type OwnerOrder = {
  id: string
  code: string
  createdAt: string
  customerName: string
  customerPhone: string
  fulfillment: OwnerOrderFulfillment
  address?: string
  items: OwnerOrderItem[]
  total: number
  paymentMethod: string
  paymentStatus: OwnerOrderPaymentStatus
  status: OwnerOrderStatus
  isNew?: boolean
  note?: string
  cancelReason?: string
}

export const ownerOrderStatusMeta: Record<
  OwnerOrderStatus,
  { label: string; className: string; dotClassName: string }
> = {
  pending: {
    label: 'Menunggu Konfirmasi',
    className: 'bg-[#fef3c7] text-[#b45309]',
    dotClassName: 'bg-[#f59e0b]',
  },
  diproses: {
    label: 'Sedang Diproses',
    className: 'bg-[#dbeafe] text-[#1d4ed8]',
    dotClassName: 'bg-[#2563eb]',
  },
  siap: {
    label: 'Siap Dikirim/Diambil',
    className: 'bg-[#ede9fe] text-[#6d28d9]',
    dotClassName: 'bg-[#7c3aed]',
  },
  selesai: {
    label: 'Selesai',
    className: 'bg-[#dcfce7] text-[#15803d]',
    dotClassName: 'bg-[#22c55e]',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    className: 'bg-[#fee2e2] text-[#b91c1c]',
    dotClassName: 'bg-[#ef4444]',
  },
}

export const ownerStorePickupAddress =
  'Jl. Melati Raya No. 42, Pasar Baru, Jakarta Pusat'

export const ownerStoreBankAccount = {
  bank: 'BCA',
  accountNumber: '5420-112-998',
}

export const ownerFulfillmentLabels: Record<OwnerOrderFulfillment, string> = {
  ambil: 'Ambil di Toko',
  'kurir-instan': 'Kurir Instan (GoSend)',
  'kurir-toko': 'Kurir Toko (Pak Joko)',
  dikirim: 'Dikirim',
}

export const ownerPaymentStatusMeta: Record<
  OwnerOrderPaymentStatus,
  { label: string; dotClassName: string; textClassName: string }
> = {
  lunas: {
    label: 'Lunas',
    dotClassName: 'bg-[#16a34a]',
    textClassName: 'text-[#15803d]',
  },
  belum: {
    label: 'Belum Dibayar',
    dotClassName: 'bg-[#f59e0b]',
    textClassName: 'text-[#b45309]',
  },
  batal: {
    label: 'Batal Bayar',
    dotClassName: 'bg-[#ef4444]',
    textClassName: 'text-[#b91c1c]',
  },
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function todayAt(hour: number, minute: number) {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function orderCode(sequence: number) {
  const now = new Date()
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  return `RTS-${stamp}-${String(sequence).padStart(3, '0')}`
}

function sumItems(items: OwnerOrderItem[]) {
  return items.reduce((total, item) => total + item.unitPrice * item.qty, 0)
}

function createOrder(
  sequence: number,
  data: Omit<OwnerOrder, 'id' | 'code' | 'total'>,
): OwnerOrder {
  return {
    ...data,
    id: `ord-${String(sequence).padStart(3, '0')}`,
    code: orderCode(sequence),
    total: sumItems(data.items),
  }
}

export const ownerOrders: OwnerOrder[] = [
  createOrder(1, {
    createdAt: todayAt(10, 15),
    customerName: 'Siti Rahmawati',
    customerPhone: '+62 812-9844-1123',
    fulfillment: 'ambil',
    items: [
      {
        name: 'Kue Lapis Legit Spesial',
        qty: 2,
        unitPrice: 150_000,
        note: 'Kotak sedang (20x20 cm)',
      },
    ],
    paymentMethod: 'Transfer Bank (BCA)',
    paymentStatus: 'lunas',
    status: 'pending',
    isNew: true,
  }),
  createOrder(2, {
    createdAt: todayAt(9, 40),
    customerName: 'Budi Santoso',
    customerPhone: '+62 878-3321-9988',
    fulfillment: 'kurir-instan',
    address: 'Jl. Melati No. 12, Beji, Depok',
    items: [
      { name: 'Pastel Tutup Panggang Jumbo', qty: 1, unitPrice: 75_000 },
      { name: 'Risol Rogout Ayam Crispy', qty: 2, unitPrice: 45_000 },
    ],
    paymentMethod: 'QRIS Dinamis',
    paymentStatus: 'lunas',
    status: 'diproses',
    isNew: true,
  }),
  createOrder(3, {
    createdAt: todayAt(9, 12),
    customerName: 'Maya Anggraini',
    customerPhone: '+62 856-4421-0021',
    fulfillment: 'ambil',
    items: [
      {
        name: 'Brownies Fudgy Almond Sea Salt',
        qty: 1,
        unitPrice: 50_000,
        note: 'Topping ekstra keju',
      },
    ],
    paymentMethod: 'Tunai di Kasir',
    paymentStatus: 'belum',
    status: 'diproses',
    note: 'Minta dipotong 8 bagian dan dibungkus terpisah.',
    isNew: true,
  }),
  createOrder(4, {
    createdAt: todayAt(8, 30),
    customerName: 'Hendra Wijaya',
    customerPhone: '+62 811-2299-4455',
    fulfillment: 'kurir-toko',
    address: 'Perumahan Griya Asri Blok C4, Sukmajaya, Depok',
    items: [
      { name: 'Kue Lapis Legit Prune Wisman Spesial', qty: 4, unitPrice: 150_000 },
      { name: 'Pastel Tutup Spesial', qty: 3, unitPrice: 75_000 },
      { name: 'Risol Rogout Ayam Crispy', qty: 1, unitPrice: 45_000 },
    ],
    paymentMethod: 'Transfer Bank (Mandiri)',
    paymentStatus: 'lunas',
    status: 'selesai',
    note: 'Kirim pagi sebelum jam 10, titip ke satpam jika rumah kosong.',
  }),
  createOrder(5, {
    createdAt: todayAt(8, 5),
    customerName: 'Dewi Lestari',
    customerPhone: '+62 813-8822-1190',
    fulfillment: 'ambil',
    items: [{ name: 'Risol Rogout Ayam Crispy', qty: 2, unitPrice: 45_000 }],
    paymentMethod: 'Tunai di Kasir',
    paymentStatus: 'batal',
    status: 'dibatalkan',
    cancelReason: 'Permintaan pembeli',
  }),
  createOrder(6, {
    createdAt: todayAt(7, 52),
    customerName: 'Rina Marlina',
    customerPhone: '+62 812-7701-3344',
    fulfillment: 'kurir-instan',
    address: 'Jl. Anggrek No. 8, Cimanggis, Depok',
    items: [{ name: 'Nastar Wisman Premium Toples', qty: 1, unitPrice: 125_000 }],
    paymentMethod: 'QRIS Dinamis',
    paymentStatus: 'lunas',
    status: 'pending',
    isNew: true,
  }),
  createOrder(7, {
    createdAt: todayAt(7, 41),
    customerName: 'Agus Setiawan',
    customerPhone: '+62 811-9033-7788',
    fulfillment: 'ambil',
    items: [{ name: 'Tumpeng Mini Nasi Kuning', qty: 1, unitPrice: 150_000 }],
    paymentMethod: 'Transfer Bank (BRI)',
    paymentStatus: 'lunas',
    status: 'pending',
    isNew: true,
  }),
  createOrder(8, {
    createdAt: todayAt(7, 30),
    customerName: 'Fitri Handayani',
    customerPhone: '+62 813-2200-5566',
    fulfillment: 'kurir-toko',
    address: 'Jl. Kenanga Raya No. 27, Pancoran Mas, Depok',
    items: [{ name: 'Bolu Gulung Keju Spesial', qty: 2, unitPrice: 85_000 }],
    paymentMethod: 'Transfer Bank (BCA)',
    paymentStatus: 'lunas',
    status: 'siap',
  }),
  createOrder(9, {
    createdAt: todayAt(7, 22),
    customerName: 'Slamet Riyadi',
    customerPhone: '+62 812-3344-9090',
    fulfillment: 'ambil',
    items: [{ name: 'Lemper Bakar Ayam Gurih', qty: 2, unitPrice: 35_000 }],
    paymentMethod: 'Kas Toko',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(10, {
    createdAt: todayAt(7, 15),
    customerName: 'Nur Aisyah',
    customerPhone: '+62 857-6612-4433',
    fulfillment: 'kurir-instan',
    address: 'Jl. Dahlia No. 5, Beji, Depok',
    items: [
      { name: 'Lapis Surabaya Kenari', qty: 1, unitPrice: 95_000 },
      { name: 'Chiffon Pandan Santan Murni', qty: 1, unitPrice: 60_000 },
    ],
    paymentMethod: 'QRIS Dinamis',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(11, {
    createdAt: todayAt(7, 5),
    customerName: 'Ahmad Subagyo',
    customerPhone: '+62 812-1188-7744',
    fulfillment: 'ambil',
    items: [{ name: 'Kroket Kentang Isi Ragout', qty: 3, unitPrice: 30_000 }],
    paymentMethod: 'Kas Toko',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(12, {
    createdAt: todayAt(6, 58),
    customerName: 'Putri Maharani',
    customerPhone: '+62 878-9900-1122',
    fulfillment: 'kurir-toko',
    address: 'Jl. Mawar No. 31, Sukmajaya, Depok',
    items: [{ name: 'Tumpeng Mini Nasi Kuning', qty: 1, unitPrice: 150_000 }],
    paymentMethod: 'Transfer Bank (BCA)',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(13, {
    createdAt: todayAt(6, 45),
    customerName: 'Maria Kristina',
    customerPhone: '+62 813-4455-6677',
    fulfillment: 'ambil',
    items: [{ name: 'Kue Lumpur Kentang Keju', qty: 2, unitPrice: 40_000 }],
    paymentMethod: 'Kas Toko',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(14, {
    createdAt: todayAt(6, 35),
    customerName: 'Rian Hidayat',
    customerPhone: '+62 812-6677-8899',
    fulfillment: 'kurir-instan',
    address: 'Jl. Flamboyan No. 3, Cilodong, Depok',
    items: [{ name: 'Brownies Fudgy Almond Sea Salt', qty: 2, unitPrice: 50_000 }],
    paymentMethod: 'QRIS Dinamis',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(15, {
    createdAt: todayAt(6, 25),
    customerName: 'Nurul Hidayah',
    customerPhone: '+62 856-7788-9900',
    fulfillment: 'ambil',
    items: [{ name: 'Bolu Gulung Keju Spesial', qty: 1, unitPrice: 85_000 }],
    paymentMethod: 'Kas Toko',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(16, {
    createdAt: todayAt(6, 15),
    customerName: 'Bagas Pratama',
    customerPhone: '+62 811-2233-4455',
    fulfillment: 'kurir-toko',
    address: 'Jl. Cempaka Putih No. 18, Sukmajaya, Depok',
    items: [{ name: 'Nastar Wisman Premium Toples', qty: 2, unitPrice: 125_000 }],
    paymentMethod: 'Transfer Bank (Mandiri)',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(17, {
    createdAt: todayAt(6, 5),
    customerName: 'Intan Permata',
    customerPhone: '+62 813-5566-7788',
    fulfillment: 'ambil',
    items: [{ name: 'Chiffon Pandan Santan Murni', qty: 1, unitPrice: 60_000 }],
    paymentMethod: 'QRIS Dinamis',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(18, {
    createdAt: todayAt(5, 58),
    customerName: 'Wisnu Saputra',
    customerPhone: '+62 878-1122-3344',
    fulfillment: 'kurir-instan',
    address: 'Jl. Sawo No. 9, Pancoran Mas, Depok',
    items: [{ name: 'Lemper Bakar Ayam Gurih', qty: 2, unitPrice: 35_000 }],
    paymentMethod: 'QRIS Dinamis',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(19, {
    createdAt: todayAt(5, 50),
    customerName: 'Laila Sari',
    customerPhone: '+62 812-8899-0011',
    fulfillment: 'ambil',
    items: [{ name: 'Lapis Surabaya Kenari', qty: 1, unitPrice: 95_000 }],
    paymentMethod: 'Kas Toko',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
  createOrder(20, {
    createdAt: todayAt(5, 40),
    customerName: 'Doni Firmansyah',
    customerPhone: '+62 857-3344-5566',
    fulfillment: 'ambil',
    items: [{ name: 'Kroket Kentang Isi Ragout', qty: 2, unitPrice: 30_000 }],
    paymentMethod: 'Kas Toko',
    paymentStatus: 'lunas',
    status: 'selesai',
  }),
]

const orderStore: OwnerOrder[] = [...ownerOrders]

export function getOwnerOrders(): OwnerOrder[] {
  return [...orderStore]
}

export function updateOwnerOrder(order: OwnerOrder) {
  const index = orderStore.findIndex((item) => item.id === order.id)
  if (index >= 0) orderStore[index] = { ...order }
}

export function addOwnerOrder(order: OwnerOrder) {
  orderStore.unshift(order)
}

export function getNextOwnerOrderSequence(): number {
  return (
    orderStore.reduce((highest, order) => {
      const sequence = Number(order.code.split('-').at(-1))
      return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest
    }, 0) + 1
  )
}

export function buildOwnerOrderCode(sequence: number): string {
  return orderCode(sequence)
}
