import { Link } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'

type AdminPlaceholderPageProps = {
  title: string
  description: string
}

export default function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="flex min-h-[calc(100vh-72px-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft/50 text-primary">
          <Construction className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        <Link
          to="/admin/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          <ArrowLeft className="size-4" />
          Kembali ke dashboard
        </Link>
      </div>
    </div>
  )
}
