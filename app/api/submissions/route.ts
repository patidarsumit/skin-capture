import { NextRequest, NextResponse } from "next/server"
import { createStorageName, writeBufferToPublic } from "@/lib/image-processing"
import { skinTones, skinTypes } from "@/lib/skin-profile"
import { defaultSubmissionFilters, listSubmissions, parseConcerns } from "@/lib/submissions"
import { prisma } from "@/lib/db"
import * as path from "path"

export const runtime = "nodejs"
export const maxDuration = 60

function bufferFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!match) {
    throw new Error("Invalid image data URL")
  }

  return Buffer.from(match[2], "base64")
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sortBy = searchParams.get("sortBy")
    const submissions = await listSubmissions({
      skinType: searchParams.get("skinType") || defaultSubmissionFilters.skinType,
      skinTone: searchParams.get("skinTone") || defaultSubmissionFilters.skinTone,
      concern: searchParams.get("concern") || defaultSubmissionFilters.concern,
      search: searchParams.get("search") || defaultSubmissionFilters.search,
      dateFrom: searchParams.get("dateFrom") || defaultSubmissionFilters.dateFrom,
      dateTo: searchParams.get("dateTo") || defaultSubmissionFilters.dateTo,
      sortBy:
        sortBy === "oldest" || sortBy === "skinType" || sortBy === "skinTone"
          ? sortBy
          : defaultSubmissionFilters.sortBy,
    })

    return NextResponse.json({
      submissions,
    })
  } catch (error) {
    console.error("Fetching submissions failed:", error)
    return NextResponse.json(
      { error: "Unable to load submissions right now." },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get("image") as File | null
    const enhancedImageData = (formData.get("enhancedImageData") as string | null) || ""
    const skinType = (formData.get("skinType") as string | null) || ""
    const skinTone = (formData.get("skinTone") as string | null) || ""
    const additionalNotes = (formData.get("additionalNotes") as string | null) || ""
    const annotationLabel = (formData.get("annotationLabel") as string | null) || ""
    const consentAccepted = formData.get("consentAccepted") === "true"
    const skinConcernsValue = (formData.get("skinConcerns") as string | null) || "[]"
    const concerns = parseConcerns(skinConcernsValue)

    if (!image) {
      return NextResponse.json({ error: "Please provide an image." }, { status: 400 })
    }

    if (!consentAccepted) {
      return NextResponse.json({ error: "Consent is required before submission." }, { status: 400 })
    }

    if (!skinTypes.includes(skinType as (typeof skinTypes)[number])) {
      return NextResponse.json({ error: "Choose a valid skin type." }, { status: 400 })
    }

    if (!skinTones.some((tone) => tone.value === skinTone)) {
      return NextResponse.json({ error: "Choose a valid skin tone." }, { status: 400 })
    }

    if (concerns.length === 0) {
      return NextResponse.json(
        { error: "Select at least one skin concern before submitting." },
        { status: 400 }
      )
    }

    if (!enhancedImageData) {
      return NextResponse.json(
        { error: "Enhance the image before submitting." },
        { status: 400 }
      )
    }

    const originalBuffer = Buffer.from(await image.arrayBuffer())
    const enhancedBuffer = bufferFromDataUrl(enhancedImageData)
    const originalFilename = createStorageName(image.name)
    const enhancedFilename = `${path.parse(createStorageName(image.name, "enhanced")).name}.png`

    const originalPath = writeBufferToPublic("submissions/originals", originalFilename, originalBuffer)
    const enhancedPath = writeBufferToPublic("submissions/enhanced", enhancedFilename, enhancedBuffer)

    const submission = await prisma.skinSubmission.create({
      data: {
        originalFilename: image.name,
        originalPath,
        enhancedPath,
        skinType,
        skinTone,
        skinConcerns: JSON.stringify(concerns),
        additionalNotes: additionalNotes.trim() || null,
        annotationLabel: annotationLabel.trim() || null,
        consentAccepted,
      },
    })

    return NextResponse.json({
      message: "Submission stored successfully.",
      submission: {
        id: submission.id,
        originalPath: submission.originalPath,
        enhancedPath: submission.enhancedPath,
        skinType: submission.skinType,
        skinTone: submission.skinTone,
      },
    })
  } catch (error) {
    console.error("Submission failed:", error)
    return NextResponse.json(
      { error: "Unable to save the submission right now." },
      { status: 500 }
    )
  }
}
