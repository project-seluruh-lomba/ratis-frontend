import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Construction, Store } from 'lucide-react'

const pageTitles: Record<string, { title: string; description: string }> = {
  pesanan: {
    title: 'Pesanan Masuk',
    description:
      'Kelola konfirmasi, pemrosesan, dan riwayat pesanan pelanggan dari satu tempat.',
  },
  produk: {
    title: 'Produk & Stok',
    description:
      'Atur katalog produk, harga, ketersediaan stok, dan kategori jualan toko Anda.',
  },
  keuangan: {
    title: 'Keuangan',
    description:
      'Pantau arus kas, catat pengeluaran operasional, dan siapkan pencairan dana.',
  },
  staf: {
    title: 'Staf Toko',
    description:
      'Undang anggota tim dan atur hak akses untuk membantu operasional toko.',
  },
  laporan: {
    title: 'Laporan & Ekspor',
    description:
      'Analisis performa penjualan dan unduh laporan toko dalam format yang dibutuhkan.',
  },
  toko: {
    title: 'Profil Toko',
    description:
      'Lengkapi identitas, alamat, jam operasional, dan informasi publik toko Anda.',
  },
  pratinjau: {
    title: 'Pratinjau Storefront',
    description:
      'Lihat tampilan toko Anda sebagaimana yang dilihat pelanggan di etalase Ratis.',
  },
  bantuan: {
    title: 'Pusat Bantuan',
    description:
      'Temukan panduan operasional atau hubungi tim dukungan Ratis saat mengalami kendala.',
  },
  notifikasi: {
    title: 'Notifikasi',
    description:
      'Semua pemberitahuan pesanan, stok, dan aktivitas toko Anda tersimpan di sini.',
  },
}

export default function OwnerPlaceholderPage() {
  const { pathname } = useLocation()
  const segment = pathname.split('/')[2] ?? ''
  const content = pageTitles[segment] ?? {
    title: 'Halaman Pemilik',
    description: 'Halaman ini sedang dalam tahap pengembangan.',
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-soft/60 text-primary">
          <Construction className="size-7" />
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10.5px] font-semibold text-slate-500">
          <Store className="size-3.5" />
          Segera Hadir
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          {content.title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
          {content.description}
        </p>
        <p className="mt-4 text-[11px] text-slate-400">
          Fitur ini belum aktif pada versi demo. Dashboard dan data contoh tetap dapat
          digunakan untuk meninjau alur pemilik toko.
        </p>
        <Link
          to="/owner/dashboard"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
