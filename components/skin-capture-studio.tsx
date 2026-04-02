"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FloatingToast } from "@/components/feedback-ui"
import type { EnhanceResponse, SubmitResponse } from "@/lib/types/api"
import type { ToastState } from "@/lib/types/ui"
import {
  initialSkinProfile,
  skinConcerns,
  skinTones,
  skinTypes,
  type SkinConcern,
  type SkinProfilePayload,
} from "@/lib/skin-profile"

const defaultMessage = "Step 1: upload or capture a skin image to begin."

export function SkinCaptureStudio() {
  const router = useRouter()
  const resultRef = useRef<HTMLElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState("")
  const [enhancedPreview, setEnhancedPreview] = useState("")
  const [profile, setProfile] = useState<SkinProfilePayload>(initialSkinProfile)
  const [enhancing, setEnhancing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(defaultMessage)
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral")
  const [savedSubmission, setSavedSubmission] = useState<SubmitResponse["submission"] | null>(null)
  const [resultView, setResultView] = useState<"before" | "after">("after")
  const [toast, setToast] = useState<ToastState>({
    open: false,
    tone: "neutral",
    title: "",
    message: "",
  })

  const canEnhance = Boolean(file)
  const profileReady = Boolean(
    profile.skinType &&
      profile.skinTone &&
      profile.skinConcerns.length > 0 &&
      profile.consentAccepted
  )
  const canSubmit = Boolean(file) && Boolean(enhancedPreview) && profileReady
  const selectedTone = useMemo(
    () => skinTones.find((tone) => tone.value === profile.skinTone),
    [profile.skinTone]
  )

  useEffect(() => {
    if (!file) {
      setOriginalPreview("")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setOriginalPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  useEffect(() => {
    if (!toast.open) return

    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }))
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [toast])

  const currentStep = enhancedPreview
    ? 4
    : profileReady
      ? 3
      : file
        ? 2
        : 1

  const nextHint = enhancedPreview
    ? "Next: submit the completed record."
    : profileReady
      ? "Next: enhance the image to generate the result."
      : file
        ? "Next: complete the required profile details."
        : "Next: select an image to unlock the flow."

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

  function showToast(tone: ToastState["tone"], title: string, nextMessage: string) {
    setToast({
      open: true,
      tone,
      title,
      message: nextMessage,
    })
  }

  function resetWorkflow(nextMessage = defaultMessage) {
    setFile(null)
    setOriginalPreview("")
    setEnhancedPreview("")
    setProfile(initialSkinProfile)
    setSavedSubmission(null)
    setResultView("after")
    setMessage(nextMessage)
    setMessageTone("neutral")
    // Clearing the hidden input lets users pick the same file again after removing it.
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] || null

    if (!nextFile) {
      return
    }

    if (nextFile.size > 8 * 1024 * 1024) {
      setMessage("Choose an image under 8 MB.")
      setMessageTone("error")
      showToast("error", "Image too large", "Choose a PNG, JPG, or WEBP file under 8 MB.")
      event.target.value = ""
      return
    }

    setFile(nextFile)
    setEnhancedPreview("")
    setSavedSubmission(null)
    setResultView("before")
    setMessage("Step 2: complete the skin profile, then enhance the image.")
    setMessageTone("neutral")
    showToast("success", "Image added", "Now complete the profile in Step 2.")
  }

  function handleClearImage() {
    resetWorkflow()
    showToast("neutral", "Image removed", "The workflow has been cleared.")
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
      setResultView("after")
      setMessage("Step 4: review the enhanced image in the result panel, then submit the record.")
      setMessageTone("success")
      showToast("success", "Enhancement ready", "Review the result, then submit the record.")
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Enhancement failed."
      setMessage(nextMessage)
      setMessageTone("error")
      showToast("error", "Enhancement failed", nextMessage)
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
      setMessage(data.message || "Submission stored successfully. Opening gallery...")
      setMessageTone("success")
      showToast("success", "Record saved", "Opening gallery...")

      window.setTimeout(() => {
        router.push("/gallery")
      }, 700)
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Submission failed."
      setMessage(nextMessage)
      setMessageTone("error")
      showToast("error", "Submission failed", nextMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-grid flex flex-1 flex-col">
      <FloatingToast open={toast.open} tone={toast.tone} title={toast.title} message={toast.message} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8 md:px-10 lg:px-12">
        <section className="soft-shadow glass-panel rounded-[32px] border border-border/80 px-6 py-8 md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-strong">
                  Skin intake workflow
                </div>
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                  Work through each step. Your latest result stays visible on the right.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-muted">
                  Complete the profile, enhance the image, and submit the final record.
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
              <p className="font-semibold">{nextHint}</p>
              <p className="mt-1 opacity-90">{message}</p>
            </div>
          </div>
        </section>

        <section className="sticky top-[69px] z-30 mt-4 md:mt-6 xl:top-[70px]">
          <div className="soft-shadow max-w-full overflow-hidden rounded-[20px] border border-border bg-card/92 p-2 backdrop-blur md:rounded-[24px] md:p-3">
            <div className="flex min-w-0 gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:pb-0">
              {[
                { step: 1, label: "Upload" },
                { step: 2, label: "Profile" },
                { step: 3, label: "Enhance" },
                { step: 4, label: "Submit" },
              ].map((item) => {
                const isDone = currentStep > item.step
                const isCurrent = currentStep === item.step

                return (
                  <div
                    key={item.step}
                    className={`min-w-[86px] shrink-0 rounded-[14px] border px-2 py-1.5 text-sm transition-colors md:min-w-0 md:rounded-[18px] md:px-4 md:py-3 ${
                      isCurrent
                        ? "border-accent bg-accent text-white"
                        : isDone
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-border bg-background text-muted"
                    }`}
                  >
                    <p className="text-[8px] font-semibold uppercase tracking-[0.1em] md:text-[11px] md:tracking-[0.16em]">
                      Step {item.step}
                    </p>
                    <p className="mt-0.5 text-[12px] font-medium leading-tight md:mt-1 md:text-sm">{item.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.24fr_0.76fr]">
          <div className="relative">
            {enhancing ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[32px] bg-[#f6f6f1]/72 backdrop-blur-[2px]">
                <div className="soft-shadow rounded-[24px] border border-border bg-card px-6 py-5 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
                  <p className="mt-4 text-sm font-semibold text-foreground">Enhancing image...</p>
                  <p className="mt-1 text-sm text-muted">Please wait a moment</p>
                </div>
              </div>
            ) : null}

            <div className={`space-y-6 ${enhancing ? "pointer-events-none" : ""}`}>
            <div>
              <StepSection
                step="Step 1"
                title="Capture or upload image"
                description="Use the device camera on mobile, or choose an existing image on desktop."
              >
                <div className="flex flex-col gap-4 rounded-[24px] border border-dashed border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">
                        {file ? file.name : "No image selected yet"}
                      </p>
                      {file ? (
                        <button
                          type="button"
                          onClick={handleClearImage}
                          aria-label="Remove selected image"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
                        >
                          <ClearIcon />
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-7 text-muted">
                      Supported formats: PNG, JPG, WEBP. This image becomes the input for enhancement
                      and final submission.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex min-w-[148px] cursor-pointer items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-strong">
                      <span className="flex w-full items-center justify-center gap-2 whitespace-nowrap text-center">
                        {file ? <ReplaceIcon /> : <UploadIcon />}
                        {file ? "Replace image" : "Select image"}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </StepSection>
            </div>

            <div>
              <StepSection
                step="Step 2"
                title="Fill the skin profile"
                description="Complete the profile before submitting. Skin type, skin tone, at least one concern, and consent are required."
                muted={!file}
              >
                <div className={`${!file ? "pointer-events-none opacity-55" : ""}`}>
                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        Skin Type <span className="text-accent">*</span>
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
                        Skin Tone <span className="text-accent">*</span>
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                        {skinTones.map((tone) => {
                          const isActive = profile.skinTone === tone.value

                          return (
                            <button
                              key={tone.value}
                              type="button"
                              onClick={() => updateProfile("skinTone", tone.value)}
                              className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                                isActive
                                  ? "border-accent bg-accent-soft shadow-[0_8px_20px_rgba(98,122,89,0.12)]"
                                  : "border-border bg-background hover:border-accent/50"
                              }`}
                            >
                              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <span
                                  aria-hidden="true"
                                  className="inline-block h-4 w-4 shrink-0 rounded-full border border-black/10"
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
                      Skin Concerns <span className="text-accent">*</span>
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

                  <details className="mt-6 rounded-[22px] border border-border bg-background px-4 py-3">
                    <summary className="cursor-pointer text-sm font-medium text-foreground">
                      Add more details
                    </summary>
                    <div className="mt-4 grid gap-6">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                          Additional Notes
                        </span>
                        <textarea
                          value={profile.additionalNotes}
                          onChange={(event) => updateProfile("additionalNotes", event.target.value)}
                          placeholder="Any extra observations, preferences, or consultation details."
                          rows={4}
                          className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                        />
                      </label>
                    </div>
                  </details>

                  <label className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={profile.consentAccepted}
                      onChange={(event) => updateProfile("consentAccepted", event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="inline-flex items-center gap-1 leading-6">
                      <span className="font-semibold text-accent">*</span>
                      I confirm consent for image capture, enhancement, and local storage.
                    </span>
                  </label>
                </div>
              </StepSection>
            </div>

            <div>
              <StepSection
                step="Step 3"
                title="Enhance image"
                description="Add an optional label, then generate the cleaned-up version."
                muted={!profileReady}
              >
                <div className={`${!profileReady ? "pointer-events-none opacity-55" : ""}`}>
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
                      disabled={!canEnhance || enhancing || !profileReady}
                      onClick={handleEnhance}
                      className={`rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                        canEnhance && profileReady
                          ? "bg-accent text-white hover:bg-accent-strong"
                          : "bg-accent/15 text-muted"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <SparkleIcon />
                        {enhancing ? "Enhancing..." : "Enhance Image"}
                      </span>
                    </button>
                  </div>
                </div>
              </StepSection>
            </div>

            <div>
              <StepSection
                step="Step 4"
                title="Submit record"
                description="Once the result looks right in the panel on the right, submit the complete record."
                muted={!enhancedPreview}
              >
                <div className="rounded-[24px] border border-border bg-background p-5 md:p-6">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">
                      Save this skin consultation
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
                      The image, enhanced result, and profile details will be stored locally and
                      shown in the gallery.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <ChecklistItem label="Image selected" ready={Boolean(file)} />
                    <ChecklistItem label="Profile completed" ready={profileReady} />
                    <ChecklistItem label="Enhanced result ready" ready={Boolean(enhancedPreview)} />
                    <ChecklistItem label="Ready to submit" ready={canSubmit} />
                  </div>

                  <div className="mt-4 rounded-[20px] border border-border bg-card px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          canSubmit ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        <CheckIcon />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {canSubmit ? "Completed and ready to submit" : "Submission not ready yet"}
                        </p>
                        <p className="mt-1 text-xs leading-6 text-muted">
                          {canSubmit
                            ? "All required steps are complete."
                            : "Complete the earlier steps to unlock submission."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-border pt-5">
                    <button
                      type="button"
                      disabled={!canSubmit || submitting}
                      onClick={handleSubmit}
                      className={`w-full rounded-full px-6 py-3 text-sm font-medium transition-colors ${
                        canSubmit
                          ? "bg-accent text-white hover:bg-accent-strong"
                          : "bg-accent/15 text-muted"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <CheckIcon />
                        {submitting ? "Submitting..." : "Submit Record"}
                      </span>
                    </button>
                  </div>
                </div>
              </StepSection>
            </div>
            </div>
          </div>

          <aside ref={resultRef} className="xl:sticky xl:top-[168px] xl:self-start">
            <div className="soft-shadow rounded-[32px] border border-border bg-card p-5">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Current result
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  Review output here
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Toggle between before and after, or compare both stacked below. This is the
                  clearest view of what the enhancement changed.
                </p>
              </div>

              <div className="flex gap-2 rounded-full border border-border bg-background p-1">
                {[
                  { key: "before", label: "Before" },
                  { key: "after", label: "After" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setResultView(option.key as "before" | "after")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      resultView === option.key
                        ? "bg-accent text-white"
                        : "text-foreground hover:bg-card"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 overflow-hidden rounded-[24px] border border-border bg-background">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {resultView === "before" ? "Original image" : "Enhanced result"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {resultView === "before"
                      ? file
                        ? file.name
                        : "No image selected"
                      : selectedTone
                        ? `${selectedTone.value} tone selected`
                        : "No enhanced result yet"}
                  </p>
                </div>
                <div className="flex aspect-square items-center justify-center p-4">
                  {resultView === "before" ? (
                    <PreviewStage imageSrc={originalPreview} emptyLabel="The uploaded image will appear here." />
                  ) : (
                    <PreviewStage
                      imageSrc={enhancedPreview}
                      emptyLabel="The enhanced image will appear here after Step 3."
                      checkered
                    />
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <MiniPreview
                  title="Before"
                  imageSrc={originalPreview}
                  onClick={() => setResultView("before")}
                />
                <MiniPreview
                  title="After"
                  imageSrc={enhancedPreview}
                  onClick={() => setResultView("after")}
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
  muted = false,
}: {
  step: string
  title: string
  description: string
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <section
      className={`soft-shadow rounded-[32px] border bg-card p-6 md:p-7 ${
        muted ? "border-border/70 opacity-90" : "border-border"
      }`}
    >
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{step}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        <div className="max-w-2xl">
          <p className="text-sm leading-7 text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function PreviewStage({
  imageSrc,
  emptyLabel,
  checkered = false,
}: {
  imageSrc: string
  emptyLabel: string
  checkered?: boolean
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden rounded-[20px] border border-border ${
        checkered
          ? "bg-[linear-gradient(45deg,#eceee8_25%,transparent_25%),linear-gradient(-45deg,#eceee8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eceee8_75%),linear-gradient(-45deg,transparent_75%,#eceee8_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0px] bg-[#f8f9f5]"
          : "bg-white"
      } transition-all`}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageSrc} alt="Preview" className="h-full w-full object-contain" />
      ) : (
        <p className="max-w-[220px] text-center text-sm leading-7 text-muted">{emptyLabel}</p>
      )}
    </div>
  )
}

function MiniPreview({
  title,
  imageSrc,
  onClick,
  checkered = false,
}: {
  title: string
  imageSrc: string
  onClick: () => void
  checkered?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[22px] border border-border bg-background p-3 text-left transition-colors hover:border-accent"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{title}</p>
      <div className="aspect-[4/3]">
        <PreviewStage
          imageSrc={imageSrc}
          emptyLabel={`No ${title.toLowerCase()} image yet.`}
          checkered={checkered}
        />
      </div>
    </button>
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

function ChecklistItem({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-border bg-card px-3.5 py-3">
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          ready ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
        }`}
      >
        <CheckIcon />
      </span>
      <span className="text-sm text-foreground">{label}</span>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0"
    >
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  )
}

function ReplaceIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0"
    >
      <path d="M17 2v5h-5" />
      <path d="M7 22v-5h5" />
      <path d="M20 9a8 8 0 0 0-13.66-3L2 10" />
      <path d="M4 15a8 8 0 0 0 13.66 3L22 14" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 12 5 5L20 7" />
    </svg>
  )
}
