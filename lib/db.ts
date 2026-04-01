import Database from "better-sqlite3"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "@/generated/prisma/client"
import * as fs from "fs"
import * as path from "path"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const databasePath = path.join(process.cwd(), "prisma", "dev.db")
const databaseUrl = process.env.DATABASE_URL || `file:${databasePath}`
const adapter = new PrismaBetterSqlite3({ url: databaseUrl })

function initializeSqlite() {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })

  const database = new Database(databasePath)
  database.exec(`
    CREATE TABLE IF NOT EXISTS "SkinSubmission" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "originalFilename" TEXT NOT NULL,
      "originalPath" TEXT NOT NULL,
      "enhancedPath" TEXT NOT NULL,
      "skinType" TEXT NOT NULL,
      "skinTone" TEXT NOT NULL,
      "skinConcerns" TEXT NOT NULL,
      "additionalNotes" TEXT,
      "annotationLabel" TEXT,
      "consentAccepted" BOOLEAN NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  database.close()
}

initializeSqlite()

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter, log: ["error"] })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
