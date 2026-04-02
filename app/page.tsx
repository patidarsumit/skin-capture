import type { Metadata } from "next"
import { SkinCaptureStudio } from "@/components/skin-capture-studio"

export const metadata: Metadata = {
  title: "Skin Capture Studio | Intake",
}

export default function Home() {
  return <SkinCaptureStudio />
}
