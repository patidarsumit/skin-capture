import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Skin Capture Studio | Gallery",
}

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
