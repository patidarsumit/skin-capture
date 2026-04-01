"use client"

import { useState } from "react"

type Submission = {
  id: number
  originalFilename: string
  originalPath: string
  enhancedPath: string
  skinType: string
  skinTone: string
  skinConcerns: string[]
  additionalNotes: string | null
  annotationLabel: string | null
  consentAccepted: boolean
  createdAt: string
}

export function SubmissionCard({
  submission,
  onDelete,
}: {
  submission: Submission
  onDelete: (id: number) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const createdAt = new Date(submission.createdAt).toLocaleString()
  const concernsLabel =
    submission.skinConcerns.length > 0 ? submission.skinConcerns.join(", ") : "None selected"
  const annotationLabel = submission.annotationLabel?.trim() || "No annotation added"
  const notesLabel = submission.additionalNotes?.trim() || "No additional notes provided"

  async function handleDelete() {
    if (!confirm("Delete this saved submission?")) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Delete failed.")
      }

      onDelete(submission.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed.")
      setDeleting(false)
    }
  }

  return (
    <article
      className={`soft-shadow relative flex h-full flex-col overflow-visible rounded-[28px] border border-border bg-card transition-opacity ${
        deleting ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete submission"
        className="absolute -right-3 -top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted shadow-[0_10px_30px_rgba(28,32,28,0.14)] transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="grid grid-cols-2 border-b border-border bg-background/40">
        <PreviewPanel
          label="Original"
          src={submission.originalPath}
          alt={`${submission.originalFilename} original`}
        />
        <PreviewPanel
          label="Enhanced"
          src={submission.enhancedPath}
          alt={`${submission.originalFilename} enhanced`}
          checkered
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Skin record
            </p>
            <h3
              className="mt-1.5 truncate text-lg font-semibold tracking-tight text-foreground"
              title={submission.originalFilename}
            >
              {submission.originalFilename}
            </h3>
            <p className="mt-1.5 text-xs text-muted">Saved {createdAt}</p>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
            #{submission.id}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{submission.skinType}</Badge>
          <Badge>{submission.skinTone}</Badge>
          {submission.consentAccepted && <Badge>Consent</Badge>}
        </div>

        <dl className="mt-4 grid gap-2.5">
          <DetailBlock label="Annotation" value={annotationLabel} />
          <DetailBlock label="Skin concerns" value={concernsLabel} />
          <DetailBlock label="Notes" value={notesLabel} multiline />
        </dl>

        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Assets
          </p>
          <div className="grid grid-cols-2 gap-3">
            <a
              href={submission.originalPath}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:border-accent"
            >
              View original
            </a>
            <a
              href={submission.enhancedPath}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-accent px-4 py-2 text-center text-sm font-medium !text-white transition-colors hover:bg-accent-strong"
            >
              View enhanced
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

function PreviewPanel({
  label,
  src,
  alt,
  checkered = false,
}: {
  label: string
  src: string
  alt: string
  checkered?: boolean
}) {
  return (
    <div className="p-3">
      <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <div
        className={`flex aspect-square items-center justify-center overflow-hidden rounded-[20px] border border-border ${
          checkered
            ? "bg-[linear-gradient(45deg,#eceee8_25%,transparent_25%),linear-gradient(-45deg,#eceee8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eceee8_75%),linear-gradient(-45deg,transparent_75%,#eceee8_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0px] bg-[#f8f9f5]"
            : "bg-white"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-contain" />
      </div>
    </div>
  )
}

function DetailBlock({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="rounded-[20px] border border-border bg-background px-3.5 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd
        className={`mt-2 text-sm text-foreground ${
          multiline ? "line-clamp-3 leading-6" : "line-clamp-2 leading-5"
        }`}
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-strong">
      {children}
    </span>
  )
}
