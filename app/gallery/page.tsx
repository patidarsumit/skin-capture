"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { FloatingToast, ModalShell } from "@/components/feedback-ui"
import { SubmissionCard } from "@/components/submission-card"
import { SubmissionFilterBar } from "@/components/submission-filter-bar"
import type { Submission, SubmissionFilters as Filters } from "@/lib/types/submission"
import type { ToastState } from "@/lib/types/ui"

export default function GalleryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [previewTarget, setPreviewTarget] = useState<{
    submission: Submission
    variant: "original" | "enhanced"
  } | null>(null)
  const [toast, setToast] = useState<ToastState>({
    open: false,
    tone: "neutral",
    title: "",
    message: "",
  })
  const [filters, setFilters] = useState<Filters>({
    skinType: "all",
    skinTone: "all",
    concern: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "newest",
  })

  useEffect(() => {
    if (!toast.open) return

    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }))
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [toast])

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.skinType !== "all") params.set("skinType", filters.skinType)
    if (filters.skinTone !== "all") params.set("skinTone", filters.skinTone)
    if (filters.concern !== "all") params.set("concern", filters.concern)
    if (filters.search) params.set("search", filters.search)
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)
    if (filters.sortBy) params.set("sortBy", filters.sortBy)

    const res = await fetch(`/api/submissions?${params.toString()}`)
    const data = await res.json()
    setSubmissions(data.submissions || [])
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const updateFilters = (next: Partial<Filters>) =>
    setFilters((current) => ({ ...current, ...next }))

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return

    setDeletingId(deleteTarget.id)

    try {
      const response = await fetch(`/api/submissions/${deleteTarget.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Delete failed.")
      }

      setSubmissions((current) => current.filter((submission) => submission.id !== deleteTarget.id))
      setDeleteTarget(null)
      setToast({
        open: true,
        tone: "success",
        title: "Record deleted",
        message: "The submission and its saved images were removed.",
      })
    } catch (error) {
      setToast({
        open: true,
        tone: "error",
        title: "Delete failed",
        message: error instanceof Error ? error.message : "Delete failed.",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const toneCounts = useMemo(() => {
    return submissions.reduce<Record<string, number>>((acc, item) => {
      acc[item.skinTone] = (acc[item.skinTone] || 0) + 1
      return acc
    }, {})
  }, [submissions])

  return (
    <div className="page-grid flex flex-1 flex-col">
      <FloatingToast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 md:px-10 lg:px-12">
        <section className="soft-shadow glass-panel rounded-[32px] border border-border/80 px-6 py-8 md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-strong">
                Saved consultations
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Gallery of submitted skin records.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                Browse all saved submissions, filter by skin details, and open original or enhanced
                assets directly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCard label="Records" value={String(submissions.length)} />
              <MetricCard
                label="Tones"
                value={String(Object.keys(toneCounts).length)}
              />
              <MetricCard
                label="Consent"
                value={String(submissions.filter((item) => item.consentAccepted).length)}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-border bg-card p-5 md:p-6">
          <SubmissionFilterBar filters={filters} onChange={updateFilters} total={submissions.length} />
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-[28px] border border-border bg-card p-5"
                >
                  <div className="aspect-[4/3] rounded-[20px] bg-accent-soft/60" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-accent-soft/70" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-accent-soft/50" />
                </div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="soft-shadow rounded-[32px] border border-border bg-card px-6 py-16 text-center">
              <p className="text-2xl font-semibold text-foreground">No submissions found</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Try adjusting the filters, or create a new skin record from the intake screen.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-medium !text-white transition-colors hover:bg-accent-strong"
              >
                Go to intake flow
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  deleting={deletingId === submission.id}
                  onRequestDelete={setDeleteTarget}
                  onPreview={(nextSubmission, variant) =>
                    setPreviewTarget({ submission: nextSubmission, variant })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ModalShell
        open={Boolean(previewTarget)}
        title={
          previewTarget
            ? `${previewTarget.variant === "original" ? "Original" : "Enhanced"} preview`
            : "Preview"
        }
        description={
          previewTarget
            ? `${previewTarget.submission.originalFilename} · ${previewTarget.submission.skinType} · ${previewTarget.submission.skinTone}`
            : undefined
        }
        onClose={() => setPreviewTarget(null)}
      >
        {previewTarget ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="relative overflow-hidden rounded-[24px] border border-border bg-background p-4">
              <a
                href={
                  previewTarget.variant === "original"
                    ? previewTarget.submission.originalPath
                    : previewTarget.submission.enhancedPath
                }
                download
                aria-label="Download preview image"
                className="absolute right-6 top-6 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card/92 text-foreground shadow-[0_10px_24px_rgba(28,32,28,0.10)] ring-1 ring-black/5 transition-all hover:bg-card hover:text-accent-strong hover:ring-accent/20"
              >
                <DownloadIcon />
              </a>
              <div className="flex aspect-square items-center justify-center rounded-[20px] border border-border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    previewTarget.variant === "original"
                      ? previewTarget.submission.originalPath
                      : previewTarget.submission.enhancedPath
                  }
                  alt={`${previewTarget.submission.originalFilename} ${previewTarget.variant}`}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <a
                  href={previewTarget.submission.originalPath}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium text-foreground transition-colors hover:border-accent"
                >
                  Open original
                </a>
                <a
                  href={previewTarget.submission.enhancedPath}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-accent px-4 py-3 text-center text-sm font-medium !text-white transition-colors hover:bg-accent-strong"
                >
                  Open enhanced
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <PreviewMeta label="Skin Type" value={previewTarget.submission.skinType} />
              <PreviewMeta label="Skin Tone" value={previewTarget.submission.skinTone} />
              <PreviewMeta
                label="Concerns"
                value={
                  previewTarget.submission.skinConcerns.length
                    ? previewTarget.submission.skinConcerns.join(", ")
                    : "None selected"
                }
              />
              <PreviewMeta
                label="Annotation"
                value={previewTarget.submission.annotationLabel?.trim() || "No annotation added"}
              />
              <PreviewMeta
                label="Notes"
                value={previewTarget.submission.additionalNotes?.trim() || "No additional notes provided"}
              />
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={Boolean(deleteTarget)}
        title="Delete saved record?"
        description="This removes the submission entry and both stored image files from local storage."
        onClose={() => {
          if (!deletingId) setDeleteTarget(null)
        }}
      >
        {deleteTarget ? (
          <div className="space-y-5">
            <div className="rounded-[24px] border border-border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">{deleteTarget.originalFilename}</p>
              <p className="mt-1 text-sm leading-7 text-muted">
                #{deleteTarget.id} · {deleteTarget.skinType} · {deleteTarget.skinTone}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={Boolean(deletingId)}
                className="rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent disabled:opacity-60"
              >
                Keep record
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={Boolean(deletingId)}
                className="rounded-full bg-rose-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
              >
                {deletingId ? "Deleting..." : "Delete record"}
              </button>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-border bg-card px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border bg-background px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  )
}
