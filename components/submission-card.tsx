"use client"
import type { Submission } from "@/lib/types/submission"

export function SubmissionCard({
  submission,
  deleting = false,
  onRequestDelete,
  onPreview,
}: {
  submission: Submission
  deleting?: boolean
  onRequestDelete: (submission: Submission) => void
  onPreview: (
    submission: Submission,
    variant: "original" | "enhanced"
  ) => void
}) {
  const createdAt = new Date(submission.createdAt).toLocaleString()
  const annotationLabel = submission.annotationLabel?.trim()
  const concernSummary =
    submission.skinConcerns.length === 0
      ? "No concerns selected"
      : submission.skinConcerns.length <= 2
        ? submission.skinConcerns.join(", ")
        : `${submission.skinConcerns.slice(0, 2).join(", ")} +${submission.skinConcerns.length - 2} more`

  return (
    <article
      className={`soft-shadow group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border bg-card transition-opacity sm:overflow-visible ${
        deleting ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onRequestDelete(submission)}
        disabled={deleting}
        aria-label="Delete submission"
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted shadow-[0_10px_24px_rgba(28,32,28,0.12)] transition-all hover:scale-105 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 sm:-right-3 sm:-top-3 sm:h-10 sm:w-10 sm:ring-4 sm:ring-background/90 sm:group-hover:shadow-[0_16px_36px_rgba(28,32,28,0.16)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="grid grid-cols-1 border-b border-border bg-background/30 sm:grid-cols-2">
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
            <h3
              className="truncate text-lg font-semibold tracking-tight text-foreground"
              title={submission.originalFilename}
            >
              {submission.originalFilename}
            </h3>
            <p className="mt-1 text-xs text-muted">Saved {createdAt}</p>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">
            #{submission.id}
          </span>
        </div>

        <div className="mt-3 flex min-h-[32px] flex-wrap gap-2">
          <Badge>{submission.skinType}</Badge>
          <Badge>{submission.skinTone}</Badge>
          <Badge>{submission.skinConcerns.length} concern{submission.skinConcerns.length !== 1 ? "s" : ""}</Badge>
        </div>

        <div className="mt-3 min-h-[34px]">
          {annotationLabel ? (
            <span className="inline-flex max-w-full rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
              <span className="truncate" title={annotationLabel}>
                {annotationLabel}
              </span>
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-muted/70">
              No annotation
            </span>
          )}
        </div>

        <div className="mt-4 mb-4 min-h-[92px] rounded-[20px] bg-background px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Summary</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{concernSummary}</p>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs uppercase tracking-[0.16em] text-muted">
            {submission.consentAccepted ? "Consent recorded" : "Consent missing"}
          </div>
          <button
            type="button"
            className="w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong sm:w-auto"
            onClick={() => onPreview(submission, "enhanced")}
          >
            Preview details
          </button>
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
    <div className="p-2.5">
      <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <div
        className={`flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[18px] border border-border sm:aspect-[4/5] ${
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase leading-none tracking-[0.14em] text-accent-strong">
      {children}
    </span>
  )
}
