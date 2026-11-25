export type OrderStatus = 'pending' | 'diproses' | 'selesai' | 'dibatalkan'

export type OrderItem = {
  name: string
  qty: number
  unitPrice: number
}

export type OrderRecord = {
  code: string
  shopName: string
  shopOwner: string
  shopCategory: string
  shopNib: string
  shopCity: string
  customer: string
  destinationCity: string
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  serviceFee: number
  total: number
  status: OrderStatus
  createdAt: string
  paymentMethod: string
  paymentLabel: string
}

const shops = [
  {
    name: 'Warung Bu Sari',
    owner: 'Sari Wulandari',
    category: 'Kuliner Tradisional',
    nib: '12092330048123',
    city: 'Kota Depok',
  },
  {
    name: 'Dapur Oma Elly',
    owner: 'Elly Kusnadi',
    category: 'Katering & Kue',
    nib: '12092330049204',
    city: 'Kota Bogor',
  },
  {
    name: 'Kopi Nusantara Lestari',
    owner: 'Bagas Pratama',
    category: 'Minuman Artisan',
    nib: '12092330050311',
    city: 'Kota Bandung',
  },
  {
    name: 'Batik Malakota Solo',
    owner: 'Agus Setiawan',
    category: 'Kriya Tekstil',
    nib: '12092330051778',
    city: 'Kota Surakarta',
  },
  {
    name: 'Keripik Tempe Mbok Nem',
    owner: 'Dewi Lestari',
    category: 'Snack Olahan',
    nib: '12092330052640',
    city: 'Kab. Malang',
  },
  {
    name: 'Madu Hutan Murni Riau',
    owner: 'Hendra Wijaya',
    category: 'Agro & Madu',
    nib: '12092330053902',
    city: 'Kota Pekanbaru',
  },
  {
    name: 'Toko Berkah Jaya',
    owner: 'Nur Aisyah',
    category: 'Sembako',
    nib: '12092330054871',
    city: 'Kota Depok',
  },
  {
    name: 'Anyaman Bambu Asri',
    owner: 'Bambang Sutrisno',
    category: 'Kriya Kayu & Bambu',
    nib: '12092330055229',
    city: 'Kab. Sleman',
  },
  {
    name: 'Gula Aren Sejahtera',
    owner: 'Umi Kalsum',
    category: 'Bahan Pokok',
    nib: '12092330056348',
    city: 'Kab. Banyumas',
  },
  {
    name: 'Rajut Ceria Nusantara',
    owner: 'Fitri Handayani',
    category: 'Fashion Rajut',
    nib: '12092330057462',
    city: 'Kota Semarang',
  },
]

const customers = [
  'Budi Santoso',
  'Siti Rahmawati',
  'Hendrik Pratama',
  'Agus Setiawan',
  'Dewi Lestari',
  'Rian Hidayat',
  'Nur Aisyah',
  'Fitri Handayani',
  'Maria Kristina',
  'Slamet Riyadi',
  'Ahmad Subagyo',
  'Putri Maharani',
]

const menus = [
  { name: 'Nasi Kotak Ayam Bakar', unitPrice: 25000 },
  { name: 'Sambal Bawang Spesial (Jar)', unitPrice: 20000 },
  { name: 'Es Teh Manis Jumbo', unitPrice: 10000 },
  { name: 'Rawon Daging Sapi', unitPrice: 38000 },
  { name: 'Soto Ayam Kampung', unitPrice: 26000 },
  { name: 'Paket Bento Sehat', unitPrice: 32500 },
  { name: 'Kopi Arabika Nusantara 200g', unitPrice: 45000 },
  { name: 'Keripik Tempe Original 250g', unitPrice: 18000 },
  { name: 'Batik Tulis Motif Parang', unitPrice: 320000 },
  { name: 'Madu Hutan Murni 500ml', unitPrice: 95000 },
  { name: 'Gula Aren Organik 500g', unitPrice: 28000 },
  { name: 'Anyaman Rotan Mini', unitPrice: 65000 },
]

const statusSequence: OrderStatus[] = [
  ...Array<OrderStatus>(8).fill('pending'),
  ...Array<OrderStatus>(14).fill('diproses'),
  ...Array<OrderStatus>(98).fill('selesai'),
  ...Array<OrderStatus>(8).fill('dibatalkan'),
]

const TOTAL_ORDERS = statusSequence.length

function createRandom(seed: number) {
  let value = seed

  return () => {
    value = (value * 1103515245 + 12345) % 2147483648
    return value / 2147483648
  }
}

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Jakarta',
})

function orderCode(date: Date, sequence: number) {
  const dayKey = dayKeyFormatter.format(date).replace(/-/g, '')
  return `#ORD-${dayKey}-${String(sequence).padStart(3, '0')}`
}

function buildOrders(): OrderRecord[] {
  const random = createRandom(20261123)
  const statuses = [...statusSequence]

  for (let index = statuses.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[statuses[index], statuses[swapIndex]] = [statuses[swapIndex], statuses[index]]
  }

  const now = Date.now()

  return Array.from({ length: TOTAL_ORDERS }, (_, index) => {
    const shop = shops[index % shops.length]
    const status = statuses[index]
    const itemCount = 1 + Math.floor(random() * 3)
    const pickedMenus = new Set<number>()

    while (pickedMenus.size < itemCount) {
      pickedMenus.add(Math.floor(random() * menus.length))
    }

    const items: OrderItem[] = [...pickedMenus].map((menuIndex) => ({
      name: menus[menuIndex].name,
      unitPrice: menus[menuIndex].unitPrice,
      qty: 1 + Math.floor(random() * 3),
    }))

    const subtotal = items.reduce((total, item) => total + item.qty * item.unitPrice, 0)
    const shippingFee = [0, 10000, 15000, 20000][Math.floor(random() * 4)]
    const createdAt = new Date(now - (index * 5.4 + random() * 4) * 60 * 60 * 1000)

    return {
      code: orderCode(createdAt, TOTAL_ORDERS - index),
      shopName: shop.name,
      shopOwner: shop.owner,
      shopCategory: shop.category,
      shopNib: shop.nib,
      shopCity: shop.city,
      customer: customers[(index * 5 + 3) % customers.length],
      destinationCity: shop.city,
      items,
      subtotal,
      shippingFee,
      serviceFee: 0,
      total: subtotal + shippingFee,
      status,
      createdAt: createdAt.toISOString(),
      paymentMethod: 'QRIS',
      paymentLabel:
        status === 'pending'
          ? 'QRIS · Menunggu Pembayaran'
          : status === 'dibatalkan'
            ? 'QRIS · Dibatalkan'
            : 'QRIS · Lunas',
    }
  }).sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )
}

export const orderRecords: OrderRecord[] = buildOrders()

export const orderShops = [...new Set(orderRecords.map((order) => order.shopName))].sort(
  (first, second) => first.localeCompare(second, 'id'),
)
