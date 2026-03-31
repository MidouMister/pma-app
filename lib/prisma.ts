// Import dotenv first to load environment variables
import "dotenv/config"

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

// Create PostgreSQL adapter for Prisma 7
const connectionString = process.env.DATABASE_URL || ""
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ["info", "warn", "error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Check DATABASE_URL on startup in development
if (process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment")
}
