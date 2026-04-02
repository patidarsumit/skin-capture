import { removeBackground } from "@imgly/background-removal-node"
import sharp from "sharp"
import * as fs from "fs"
import * as path from "path"

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()

  switch (ext) {
    case ".png":
      return "image/png"
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".webp":
      return "image/webp"
    default:
      return "application/octet-stream"
  }
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function enhanceImageBuffer(
  fileBuffer: Buffer,
  filename: string,
  annotationLabel: string
): Promise<Buffer> {
  // Background removal returns the processed subject as a transparent PNG-like blob.
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: getMimeType(filename) })
  const resultBlob = await removeBackground(blob)
  const enhancedBuffer = Buffer.from(await resultBlob.arrayBuffer())

  if (!annotationLabel.trim()) {
    return enhancedBuffer
  }

  const metadata = await sharp(enhancedBuffer).metadata()
  const width = metadata.width ?? 1200
  const height = metadata.height ?? 1200
  const safeLabel = escapeSvgText(annotationLabel.trim())
  // Scale the overlay from the processed image so the label stays readable across inputs.
  const fontSize = Math.max(32, Math.round(width * 0.045))
  const overlayHeight = Math.max(fontSize + 26, Math.round(fontSize * 1.75))
  const horizontalPadding = Math.max(18, Math.round(fontSize * 0.62))
  // Estimate text width from character count, then cap the pill so long labels do not dominate the image.
  const estimatedTextWidth = Math.max(
    92,
    Math.round(annotationLabel.trim().length * fontSize * 0.56)
  )
  const overlayWidth = Math.min(
    Math.max(estimatedTextWidth + horizontalPadding * 2, 160),
    Math.round(width * 0.82)
  )
  const overlayX = 24
  const overlayY = height - overlayHeight - 24
  const textX = overlayX + horizontalPadding
  // Align the text visually within the pill instead of relying on raw font metrics.
  const textY = overlayY + Math.round(overlayHeight * 0.62)
  const cornerRadius = Math.round(overlayHeight / 2)

  const overlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="${overlayX}"
        y="${overlayY}"
        rx="${cornerRadius}"
        ry="${cornerRadius}"
        width="${overlayWidth}"
        height="${overlayHeight}"
        fill="rgba(28, 32, 28, 0.78)"
      />
      <text
        x="${textX}"
        y="${textY}"
        fill="#ffffff"
        font-size="${fontSize}"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="600"
      >${safeLabel}</text>
    </svg>
  `)

  return sharp(enhancedBuffer)
    // Composite the label onto the transparent PNG returned by background removal.
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer()
}

export function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

export function writeBufferToPublic(relativeDir: string, filename: string, buffer: Buffer) {
  const dirPath = path.join(process.cwd(), "public", relativeDir)
  ensureDir(dirPath)
  const absolutePath = path.join(dirPath, filename)
  fs.writeFileSync(absolutePath, buffer)
  return `/${relativeDir}/${filename}`
}

export function createStorageName(filename: string, suffix = "") {
  const ext = path.extname(filename) || ".png"
  const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return suffix ? `${base}-${suffix}${ext}` : `${base}${ext}`
}
