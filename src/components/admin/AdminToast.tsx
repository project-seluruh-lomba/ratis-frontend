import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

export type ToastTone = 'success' | 'error' | 'info'

type AdminToastProps = {
  message: string
  tone: ToastTone
  onClose: () => void
}

const toneConfig = {
  success: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-200 bg-emerald-50',
    iconClass: 'text-emerald-600',
    textClass: 'text-emerald-900',
  },
  error: {
    icon: AlertTriangle,
    wrapper: 'border-red-200 bg-red-50',
    iconClass: 'text-red-600',
    textClass: 'text-red-900',
  },
  info: {
    icon: Info,
    wrapper: 'border-sky-200 bg-sky-50',
    iconClass: 'text-sky-600',
    textClass: 'text-sky-900',
  },
}

export default function AdminToast({ message, tone, onClose }: AdminToastProps) {
  const config = toneConfig[tone]
  const Icon = config.icon

  return (
    <div
      role="status"
      className={`fixed right-4 top-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm items-start gap-3 rounded-xl border p-3.5 shadow-lg ${config.wrapper}`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${config.iconClass}`} />
      <p className={`flex-1 text-xs font-medium leading-relaxed ${config.textClass}`}>{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className={`flex size-5 shrink-0 items-center justify-center rounded-md opacity-60 transition hover:opacity-100 ${config.textClass}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
