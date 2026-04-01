"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "Intake" },
  { href: "/gallery", label: "Gallery" },
]

export function HeaderNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-3">
      {links.map((link) => {
        const isActive = pathname === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-accent bg-accent !text-white"
                : "border-border text-foreground hover:border-accent"
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
