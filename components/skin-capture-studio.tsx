"use client"

import { ChangeEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  initialSkinProfile,
  skinConcerns,
  skinTones,
  skinTypes,
  type SkinConcern,
  type SkinProfilePayload,
} from "@/lib/skin-profile"

type EnhanceResponse = {
  imageDataUrl?: string
  error?: string
}

type SubmitResponse = {
  message?: string
  error?: string
  submission?: {
    id: number
    originalPath: string
    enhancedPath: string
  }
}

const defaultMessage = "Step 1: upload or capture a skin image to begin."

export function SkinCaptureStudio() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState("")
  const [enhancedPreview, setEnhancedPreview] = useState("")
  const [profile, setProfile] = useState<SkinProfilePayload>(initialSkinProfile)
  const [enhancing, setEnhancing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(defaultMessage)
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral")
  const [savedSubmission, setSavedSubmission] = useState<SubmitResponse["submission"] | null>(null)

  useEffect(() => {
    if (!file) {
      setOriginalPreview("")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setOriginalPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const canEnhance = Boolean(file)
  const profileReady = Boolean(profile.skinType && profile.skinTone)
  const canSubmit = Boolean(file) && Boolean(enhancedPreview) && profileReady && profile.consentAccepted

  const selectedTone = useMemo(
    () => skinTones.find((tone) => tone.value === profile.skinTone),
    [profile.skinTone]
  )

  function updateProfile<K extends keyof SkinProfilePayload>(key: K, value: SkinProfilePayload[K]) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  function toggleConcern(concern: SkinConcern) {
    setProfile((current) => ({
      ...current,
      skinConcerns: current.skinConcerns.includes(concern)
        ? current.skinConcerns.filter((item) => item !== concern)
        : [...current.skinConcerns, concern],
    }))
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null
    setFile(nextFile)
    setEnhancedPreview("")
    setSavedSubmission(null)
    setMessage(nextFile ? "Step 2: complete the skin profile, then enhance the image." : defaultMessage)
    setMessageTone("neutral")
  }

  async function handleEnhance() {
    if (!file) {
      return
    }

    setEnhancing(true)
    setSavedSubmission(null)
    setMessage("Enhancing image...")
    setMessageTone("neutral")

    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("annotationLabel", profile.annotationLabel)

      const response = await fetch("/api/enhance", {
        method: "POST",
        body: formData,
      })

      const data = (await response.json()) as EnhanceResponse

      if (!response.ok || !data.imageDataUrl) {
        throw new Error(data.error || "Enhancement failed.")
      }

      setEnhancedPreview(data.imageDataUrl)
      setMessage("Step 4: review the enhanced image in the result panel, then submit the record.")
      setMessageTone("success")
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Enhancement failed."
      setMessage(nextMessage)
      setMessageTone("error")
    } finally {
      setEnhancing(false)
    }
  }

  async function handleSubmit() {
    if (!file) {
      return
    }

    setSubmitting(true)
    setSavedSubmission(null)
    setMessage("Submitting record...")
    setMessageTone("neutral")

    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("enhancedImageData", enhancedPreview)
      formData.append("skinType", profile.skinType)
      formData.append("skinTone", profile.skinTone)
      formData.append("skinConcerns", JSON.stringify(profile.skinConcerns))
      formData.append("additionalNotes", profile.additionalNotes)
      formData.append("annotationLabel", profile.annotationLabel)
      formData.append("consentAccepted", String(profile.consentAccepted))

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      })

      const data = (await response.json()) as SubmitResponse

      if (!response.ok || !data.submission) {
        throw new Error(data.error || "Submission failed.")
      }

      setSavedSubmission(data.submission)
      setMessage(data.message || "Submission stored successfully. The end result is visible in the result panel.")
      setMessageTone("success")
      router.push("/gallery")
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Submission failed."
      setMessage(nextMessage)
      setMessageTone("error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-grid flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 md:px-10 lg:px-12">
        <section className="soft-shadow glass-panel rounded-[32px] border border-border/80 px-6 py-8 md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-strong">
                Skin intake workflow
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Follow the steps from left to right. Your latest result always appears on the right.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                This screen is organized as a guided flow: select image, complete profile, enhance,
                and submit. The right-side panel shows the current output and the final saved result.
              </p>
            </div>

            <div
              className={`rounded-[24px] border px-4 py-3 text-sm leading-7 xl:max-w-md ${
                messageTone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : messageTone === "error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-border bg-card text-muted"
              }`}
            >
              {message}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <StepSection
              step="Step 1"
              title="Capture or upload image"
              description="Use the device camera on mobile, or choose an existing image on desktop."
            >
              <div className="flex flex-col gap-4 rounded-[24px] border border-dashed border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {file ? file.name : "No image selected yet"}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    Supported formats: PNG, JPG, WEBP. This image becomes the input for enhancement
                    and final submission.
                  </p>
                </div>
                <label className="inline-flex min-w-36 cursor-pointer items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-strong">
                  <span className="block w-full text-center">Select image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </StepSection>

            <StepSection
              step="Step 2"
              title="Fill the skin profile"
              description="Complete the profile before submitting. Skin type, skin tone, and consent are required."
            >
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Skin Type
                  </span>
                  <select
                    value={profile.skinType}
                    onChange={(event) =>
                      updateProfile("skinType", event.target.value as SkinProfilePayload["skinType"])
                    }
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                  >
                    <option value="">Select skin type</option>
                    {skinTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Skin Tone
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {skinTones.map((tone) => {
                      const isActive = profile.skinTone === tone.value

                      return (
                        <button
                          key={tone.value}
                          type="button"
                          onClick={() => updateProfile("skinTone", tone.value)}
                          className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                            isActive
                              ? "border-accent bg-accent-soft"
                              : "border-border bg-background hover:border-accent/50"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <span
                              className="h-4 w-4 rounded-full border border-black/10"
                              style={{ backgroundColor: tone.swatch }}
                            />
                            {tone.value}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Skin Concerns
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {skinConcerns.map((concern) => {
                    const checked = profile.skinConcerns.includes(concern)

                    return (
                      <label
                        key={concern}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                          checked
                            ? "border-accent bg-accent-soft text-accent-strong"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleConcern(concern)}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        <span>{concern}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 grid gap-6">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Additional Notes
                  </span>
                  <textarea
                    value={profile.additionalNotes}
                    onChange={(event) => updateProfile("additionalNotes", event.target.value)}
                    placeholder="Any extra observations, preferences, or consultation details."
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={profile.consentAccepted}
                    onChange={(event) => updateProfile("consentAccepted", event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                  />
                  <span className="leading-7">
                    I confirm the user has consented to image capture, enhancement, and local data
                    storage for this consultation.
                  </span>
                </label>
              </div>
            </StepSection>

            <StepSection
              step="Step 3"
              title="Enhance image"
              description="Add an optional label, then generate the cleaned-up version."
            >
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    Text Overlay Label
                  </span>
                  <input
                    type="text"
                    value={profile.annotationLabel}
                    onChange={(event) => updateProfile("annotationLabel", event.target.value)}
                    placeholder="e.g. Priya · Sensitive skin"
                    className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                  />
                </label>

                <button
                  type="button"
                  disabled={!canEnhance || enhancing}
                  onClick={handleEnhance}
                  className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-accent/50"
                >
                  {enhancing ? "Enhancing..." : "Enhance Image"}
                </button>
              </div>
            </StepSection>

            <StepSection
              step="Step 4"
              title="Submit record"
              description="Once the result looks right in the panel on the right, submit the complete record."
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="grid gap-2 text-sm text-muted">
                  <StatusRow label="Image selected" ready={Boolean(file)} compact />
                  <StatusRow label="Profile completed" ready={profileReady} compact />
                  <StatusRow label="Consent accepted" ready={profile.consentAccepted} compact />
                  <StatusRow label="Enhanced preview ready" ready={Boolean(enhancedPreview)} compact />
                </div>

                <button
                  type="button"
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmit}
                  className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-accent/50"
                >
                  {submitting ? "Submitting..." : "Submit Record"}
                </button>
              </div>
            </StepSection>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="soft-shadow rounded-[32px] border border-border bg-card p-5">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Current result
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  Review output here
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  This panel shows the current before/after preview and the final saved links after
                  submission.
                </p>
              </div>

              <div className="space-y-4">
                <PreviewCard
                  title="Original Image"
                  subtitle={file ? file.name : "No image selected"}
                  imageSrc={originalPreview}
                  emptyLabel="The uploaded image will appear here."
                />
                <PreviewCard
                  title="Enhanced Result"
                  subtitle={selectedTone ? `${selectedTone.value} tone selected` : "No enhanced result yet"}
                  imageSrc={enhancedPreview}
                  emptyLabel="The enhanced image will appear here after Step 3."
                  checkered
                />
              </div>

              <div className="mt-5 rounded-[24px] border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Final saved result
                </p>
                {savedSubmission ? (
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="rounded-full bg-accent-soft px-3 py-1 text-accent-strong">
                      Record #{savedSubmission.id} saved
                    </div>
                    <a
                      href={savedSubmission.originalPath}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-border px-4 py-3 text-foreground transition-colors hover:border-accent"
                    >
                      View original image
                    </a>
                    <a
                      href={savedSubmission.enhancedPath}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-border px-4 py-3 text-foreground transition-colors hover:border-accent"
                    >
                      View enhanced image
                    </a>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-muted">
                    After submission, the saved record and image links will appear here.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function StepSection({
  step,
  title,
  description,
  children,
}: {
  step: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="soft-shadow rounded-[32px] border border-border bg-card p-6 md:p-7">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{step}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-muted">{description}</p>
      </div>
      {children}
    </section>
  )
}

function PreviewCard({
  title,
  subtitle,
  imageSrc,
  emptyLabel,
  checkered = false,
}: {
  title: string
  subtitle: string
  imageSrc: string
  emptyLabel: string
  checkered?: boolean
}) {
  return (
    <div className="rounded-[24px] border border-border bg-background p-4">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{title}</p>
        <p className="mt-1 truncate text-sm text-muted">{subtitle}</p>
      </div>
      <div
        className={`flex aspect-square items-center justify-center overflow-hidden rounded-[20px] border border-border ${
          checkered
            ? "bg-[linear-gradient(45deg,#eceee8_25%,transparent_25%),linear-gradient(-45deg,#eceee8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eceee8_75%),linear-gradient(-45deg,transparent_75%,#eceee8_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0px] bg-[#f8f9f5]"
            : "bg-white"
        }`}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={title} className="h-full w-full object-contain" />
        ) : (
          <p className="max-w-[220px] text-center text-sm leading-7 text-muted">{emptyLabel}</p>
        )}
      </div>
    </div>
  )
}

function StatusRow({
  label,
  ready,
  compact = false,
}: {
  label: string
  ready: boolean
  compact?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border border-border bg-background ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <span className="text-foreground">{label}</span>
      <span
        className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
          ready ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
        }`}
      >
        {ready ? "Ready" : "Pending"}
      </span>
    </div>
  )
}
