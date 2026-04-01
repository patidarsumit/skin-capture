import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createStorageName, writeBufferToPublic } from "@/lib/image-processing"
import { skinConcerns, skinTones, skinTypes, type SkinConcern } from "@/lib/skin-profile"
import * as path from "path"

export const runtime = "nodejs"
export const maxDuration = 60

function parseConcerns(input: string) {
  try {
    const parsed = JSON.parse(input)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((value): value is SkinConcern =>
      typeof value === "string" &&
      skinConcerns.includes(value as SkinConcern)
    )
  } catch {
    return []
  }
}

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
    const skinType = searchParams.get("skinType")
    const skinTone = searchParams.get("skinTone")
    const concern = searchParams.get("concern")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: {
      skinType?: string
      skinTone?: string
      originalFilename?: { contains: string }
      createdAt?: { gte?: Date; lte?: Date }
      skinConcerns?: { contains: string }
    } = {}

    if (skinType && skinType !== "all") where.skinType = skinType
    if (skinTone && skinTone !== "all") where.skinTone = skinTone
    if (search) where.originalFilename = { contains: search }
    if (concern && concern !== "all") where.skinConcerns = { contains: concern }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const submissions = await prisma.skinSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      submissions: submissions.map((submission) => ({
        ...submission,
        skinConcerns: parseConcerns(submission.skinConcerns),
      })),
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
