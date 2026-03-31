// Import dotenv first to load environment variables
import "dotenv/config"

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

// Create PostgreSQL adapter for Prisma 7
const connectionString = process.env.DATABASE_URL || ""
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ["info", "warn", "error"],
})

async function main() {
  // Check if DATABASE_URL is loaded
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in environment")
    process.exit(1)
  }

  console.log("Seeding Plan records...")

  const starter = await prisma.plan.create({
    data: {
      id: "starter",
      name: "Starter",
      priceDA: 0,
      maxUnits: 1,
      maxProjects: 5,
      maxTasksPerProject: 20,
      maxMembers: 10,
    },
  })

  console.log("Created Starter plan:", starter)

  const pro = await prisma.plan.create({
    data: {
      id: "pro",
      name: "Pro",
      priceDA: 49000,
      maxUnits: 5,
      maxProjects: 30,
      maxTasksPerProject: 200,
      maxMembers: 50,
    },
  })

  console.log("Created Pro plan:", pro)

  const premium = await prisma.plan.create({
    data: {
      id: "premium",
      name: "Premium",
      priceDA: 99000,
      maxUnits: null,
      maxProjects: null,
      maxTasksPerProject: null,
      maxMembers: null,
    },
  })

  console.log("Created Premium plan:", premium)

  console.log("\n✅ Seed completed successfully!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
