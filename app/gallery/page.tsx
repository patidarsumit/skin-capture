"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { SubmissionCard } from "@/components/submission-card"
import { SubmissionFilterBar } from "@/components/submission-filter-bar"

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

type Filters = {
  skinType: string
  skinTone: string
  concern: string
  search: string
  dateFrom: string
  dateTo: string
}

export default function GalleryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    skinType: "all",
    skinTone: "all",
    concern: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  })

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.skinType !== "all") params.set("skinType", filters.skinType)
    if (filters.skinTone !== "all") params.set("skinTone", filters.skinTone)
    if (filters.concern !== "all") params.set("concern", filters.concern)
    if (filters.search) params.set("search", filters.search)
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
    if (filters.dateTo) params.set("dateTo", filters.dateTo)

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

  const handleDelete = (id: number) =>
    setSubmissions((current) => current.filter((submission) => submission.id !== id))

  const toneCounts = useMemo(() => {
    return submissions.reduce<Record<string, number>>((acc, item) => {
      acc[item.skinTone] = (acc[item.skinTone] || 0) + 1
      return acc
    }, {})
  }, [submissions])

  return (
    <div className="page-grid flex flex-1 flex-col">
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
              <a
                href="/"
                className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                Go to intake flow
              </a>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {submissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>
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
