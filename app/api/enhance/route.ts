import { NextRequest, NextResponse } from "next/server"
import { enhanceImageBuffer } from "@/lib/image-processing"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    const annotationLabel = (formData.get("annotationLabel") as string | null) || ""

    if (!file) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const enhancedBuffer = await enhanceImageBuffer(fileBuffer, file.name, annotationLabel)

    return NextResponse.json({
      imageDataUrl: `data:image/png;base64,${enhancedBuffer.toString("base64")}`,
    })
  } catch (error) {
    console.error("Enhancement failed:", error)
    return NextResponse.json(
      { error: "Unable to enhance the image right now." },
      { status: 500 }
    )
  }
}
