import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { HeaderNav } from "@/components/header-nav"
import { ScrollControls } from "@/components/feedback-ui"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Skin Capture Studio",
  description: "Capture a skin image, complete a skin profile, enhance the image, and submit the record.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-10 lg:px-12">
            <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
              Skin Capture Studio
            </Link>
            <HeaderNav />
          </div>
        </header>
        {children}
        <ScrollControls />
      </body>
    </html>
  )
}
