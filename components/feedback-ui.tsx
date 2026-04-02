"use client"

import { useEffect, useState } from "react"

export function FloatingToast({
  open,
  tone,
  title,
  message,
}: {
  open: boolean
  tone: "neutral" | "success" | "error"
  title: string
  message: string
}) {
  if (!open) return null

  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-border bg-card text-foreground"

  return (
    <div className="pointer-events-none fixed right-5 top-20 z-50 w-[min(360px,calc(100vw-2rem))]">
      <div className={`soft-shadow rounded-[24px] border px-4 py-3 ${toneClass}`}>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 opacity-80">{message}</p>
      </div>
    </div>
  )
}

export function ModalShell({
  open,
  title,
  description,
  children,
  onClose,
}: {
  open: boolean
  title: string
  description?: string
  children: React.ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c201c]/45 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="soft-shadow relative z-10 w-full max-w-3xl rounded-[30px] border border-border bg-card p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export function ScrollControls() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function updateScrollState() {
      const scrollTop = window.scrollY
      setVisible(scrollTop > 24)
    }

    updateScrollState()
    window.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)

    return () => {
      window.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <ScrollButton
        label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUpIcon />
      </ScrollButton>
    </div>
  )
}

function ScrollButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card/92 text-foreground shadow-[0_10px_24px_rgba(28,32,28,0.10)] ring-1 ring-black/5 backdrop-blur transition-all hover:bg-card hover:text-accent-strong hover:ring-accent/20"
    >
      {children}
    </button>
  )
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}
