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
  const overlayHeight = Math.max(92, Math.round(height * 0.12))
  const fontSize = Math.max(28, Math.round(width * 0.04))

  const overlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="${height - overlayHeight - 24}" rx="22" ry="22" width="${Math.max(
        240,
        Math.round(width * 0.52)
      )}" height="${overlayHeight}" fill="rgba(28, 32, 28, 0.78)" />
      <text
        x="48"
        y="${height - Math.round(overlayHeight * 0.42)}"
        fill="#ffffff"
        font-size="${fontSize}"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="600"
      >${safeLabel}</text>
    </svg>
  `)

  return sharp(enhancedBuffer)
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
