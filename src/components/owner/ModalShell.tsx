import { useEffect, useRef, type ReactNode } from 'react'

export default function ModalShell({
  children,
  labelledBy,
  onClose,
  width = 'max-w-md',
}: {
  children: ReactNode
  labelledBy: string
  onClose: () => void
  width?: string
}) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative max-h-[calc(100vh-2rem)] w-full ${width} overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:p-6`}
      >
        {children}
      </div>
    </div>
  )
}
