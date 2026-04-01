import "dotenv/config"
import path from "node:path"
import { defineConfig } from "prisma/config"

const databasePath = path.join(process.cwd(), "prisma", "dev.db")

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || `file:${databasePath}`,
  },
})
