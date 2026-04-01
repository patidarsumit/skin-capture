import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as fs from "fs"
import * as path from "path"

export const runtime = "nodejs"

function publicPathToAbsolute(assetPath: string) {
  return path.join(process.cwd(), "public", assetPath.replace(/^\/+/, ""))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeId } = await params
    const id = Number.parseInt(routeId, 10)

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid submission id." }, { status: 400 })
    }

    const submission = await prisma.skinSubmission.findUnique({ where: { id } })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 })
    }

    for (const assetPath of [submission.originalPath, submission.enhancedPath]) {
      try {
        const absolutePath = publicPathToAbsolute(assetPath)
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath)
        }
      } catch (error) {
        console.error(`Failed to remove asset ${assetPath}:`, error)
      }
    }

    await prisma.skinSubmission.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Deleting submission failed:", error)
    return NextResponse.json(
      { error: "Unable to delete this submission right now." },
      { status: 500 }
    )
  }
}
