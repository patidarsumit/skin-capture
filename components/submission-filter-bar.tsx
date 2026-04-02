"use client"

import { skinConcerns, skinTones, skinTypes } from "@/lib/skin-profile"

type Filters = {
  skinType: string
  skinTone: string
  concern: string
  search: string
  sortBy: string
}

export function SubmissionFilterBar({
  filters,
  onChange,
  total,
}: {
  filters: Filters
  onChange: (next: Partial<Filters>) => void
  total: number
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
        {["all", ...skinTypes].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange({ skinType: item })}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
              filters.skinType === item
                ? "border-accent bg-accent text-white"
                : "border-border bg-background text-foreground hover:border-accent/50"
            }`}
          >
            {item === "all" ? "All skin types" : item}
          </button>
        ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Sort
          </label>
          <select
            value={filters.sortBy}
            onChange={(event) => onChange({ sortBy: event.target.value })}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="skinType">Skin type</option>
            <option value="skinTone">Skin tone</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_repeat(2,minmax(0,0.7fr))_auto]">
        <input
          type="text"
          placeholder="Search by filename..."
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
        />

        <select
          value={filters.skinTone}
          onChange={(event) => onChange({ skinTone: event.target.value })}
          className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
        >
          <option value="all">All tones</option>
          {skinTones.map((tone) => (
            <option key={tone.value} value={tone.value}>
              {tone.value}
            </option>
          ))}
        </select>

        <select
          value={filters.concern}
          onChange={(event) => onChange({ concern: event.target.value })}
          className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
        >
          <option value="all">All concerns</option>
          {skinConcerns.map((concern) => (
            <option key={concern} value={concern}>
              {concern}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted">
          {total} result{total !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  )
}
